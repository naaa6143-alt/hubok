import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";

async function circleWithRoom(circleId: number) {
  const [c] = await db.select().from(s.circles).where(and(eq(s.circles.id, circleId), isNull(s.circles.archivedAt))).limit(1);
  if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "الحلقة غير موجودة أو مؤرشفة" });
  const [n] = await db.select({ n: sql<number>`count(*)` }).from(s.enrollments).where(and(eq(s.enrollments.circleId, circleId), isNull(s.enrollments.archivedAt)));
  if (Number(n.n) >= c.capacity) throw new TRPCError({ code: "BAD_REQUEST", message: `الحلقة «${c.name}» ممتلئة (${c.capacity})` });
  return c;
}
export const distributionRouter = router({
  state: adminProcedure.query(async () => {
    const accepted = await db.select().from(s.applicants).where(and(eq(s.applicants.kind, "student"), eq(s.applicants.status, "accepted"), isNull(s.applicants.archivedAt)));
    const active = await db.select().from(s.enrollments).where(isNull(s.enrollments.archivedAt));
    const circles = await db.select().from(s.circles).where(isNull(s.circles.archivedAt));
    const enrolledIds = new Set(active.map((e) => e.applicantId));
    return {
      pending: accepted.filter((a) => !enrolledIds.has(a.id)).map((a) => ({ id: a.id, name: a.fullName, phone: a.phone, age: a.age, program: a.program })),
      circles: circles.map((c) => ({ id: c.id, name: c.name, capacity: c.capacity, enrolled: active.filter((e) => e.circleId === c.id).length })),
      enrollments: active.map((e) => ({ id: e.id, circleId: e.circleId, applicantId: e.applicantId, name: accepted.find((a) => a.id === e.applicantId)?.fullName ?? "—" })),
    };
  }),
  assign: adminProcedure.input(z.object({ applicantId: z.number(), circleId: z.number() })).mutation(async ({ input: i }) => {
    const [a] = await db.select().from(s.applicants).where(eq(s.applicants.id, i.applicantId)).limit(1);
    if (!a || a.kind !== "student" || a.archivedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "الطالب غير متاح" });
    if (a.status !== "accepted") throw new TRPCError({ code: "BAD_REQUEST", message: "يشترط أن تكون حالة الطالب «مقبول»" });
    const [ex] = await db.select().from(s.enrollments).where(and(eq(s.enrollments.applicantId, a.id), isNull(s.enrollments.archivedAt))).limit(1);
    if (ex) throw new TRPCError({ code: "BAD_REQUEST", message: "الطالب موزّع بالفعل، استخدم النقل" });
    await circleWithRoom(i.circleId);
    await db.insert(s.enrollments).values({ applicantId: a.id, circleId: i.circleId });
    return true;
  }),
  move: adminProcedure.input(z.object({ enrollmentId: z.number(), toCircleId: z.number() })).mutation(async ({ input: i }) => {
    const [e] = await db.select().from(s.enrollments).where(and(eq(s.enrollments.id, i.enrollmentId), isNull(s.enrollments.archivedAt))).limit(1);
    if (!e) throw new TRPCError({ code: "NOT_FOUND", message: "القيد غير موجود" });
    if (e.circleId === i.toCircleId) throw new TRPCError({ code: "BAD_REQUEST", message: "الطالب في هذه الحلقة بالفعل" });
    await circleWithRoom(i.toCircleId);
    await db.update(s.enrollments).set({ archivedAt: new Date() }).where(eq(s.enrollments.id, e.id)); // أرشفة القيد القديم
    await db.insert(s.enrollments).values({ applicantId: e.applicantId, circleId: i.toCircleId });
    return true;
  }),
  unassign: adminProcedure.input(z.object({ enrollmentId: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.enrollments).set({ archivedAt: new Date() }).where(eq(s.enrollments.id, i.enrollmentId));
    return true;
  }),
});
