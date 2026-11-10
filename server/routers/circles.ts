import { z } from "zod";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";

const input = z.object({
  name: z.string().trim().min(2, "أدخل اسم الحلقة"), teacherId: z.number().nullable().optional(), courseId: z.number().nullable().optional(),
  curriculumId: z.number().nullable().optional(), capacity: z.number().int().min(1).max(200),
});
const vals = (i: z.infer<typeof input>) => ({ name: i.name, teacherId: i.teacherId ?? null, courseId: i.courseId ?? null, curriculumId: i.curriculumId ?? null, capacity: i.capacity });

export const circlesRouter = router({
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false) })).query(async ({ input: i }) => {
    const rows = await db.select().from(s.circles).where(i.archived ? isNotNull(s.circles.archivedAt) : isNull(s.circles.archivedAt)).orderBy(desc(s.circles.createdAt));
    const counts = await db.select({ id: s.enrollments.circleId, n: sql<number>`count(*)` }).from(s.enrollments).where(isNull(s.enrollments.archivedAt)).groupBy(s.enrollments.circleId);
    const teachers = await db.select({ id: s.applicants.id, name: s.applicants.fullName }).from(s.applicants).where(eq(s.applicants.kind, "teacher"));
    const courses = await db.select({ id: s.courses.id, name: s.courses.name }).from(s.courses);
    const curr = await db.select({ id: s.curricula.id, name: s.curricula.name }).from(s.curricula);
    return rows.map((r) => ({
      ...r, enrolled: Number(counts.find((c) => c.id === r.id)?.n ?? 0),
      teacherName: teachers.find((t) => t.id === r.teacherId)?.name ?? null,
      courseName: courses.find((c) => c.id === r.courseId)?.name ?? null,
      curriculumName: curr.find((c) => c.id === r.curriculumId)?.name ?? null,
    }));
  }),
  options: adminProcedure.query(async () => ({
    teachers: await db.select({ id: s.applicants.id, name: s.applicants.fullName }).from(s.applicants).where(and(eq(s.applicants.kind, "teacher"), eq(s.applicants.status, "accepted"), isNull(s.applicants.archivedAt))),
    courses: await db.select({ id: s.courses.id, name: s.courses.name, isDefault: s.courses.isDefault }).from(s.courses).where(isNull(s.courses.archivedAt)),
    curricula: await db.select({ id: s.curricula.id, name: s.curricula.name }).from(s.curricula).where(isNull(s.curricula.archivedAt)),
    circles: await db.select({ id: s.circles.id, name: s.circles.name }).from(s.circles).where(isNull(s.circles.archivedAt)),
  })),
  create: adminProcedure.input(input).mutation(async ({ input: i }) => {
    let v = vals(i);
    if (!v.courseId) { const [d] = await db.select().from(s.courses).where(and(eq(s.courses.isDefault, true), isNull(s.courses.archivedAt))).limit(1); if (d) v = { ...v, courseId: d.id }; }
    await db.insert(s.circles).values(v);
    return true;
  }),
  update: adminProcedure.input(input.extend({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.circles).set(vals(i)).where(eq(s.circles.id, i.id));
    return true;
  }),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.circles).set({ archivedAt: new Date() }).where(eq(s.circles.id, i.id));
    return true;
  }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.circles).set({ archivedAt: null }).where(eq(s.circles.id, i.id));
    return true;
  }),
});
