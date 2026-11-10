import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { activeRoster } from "../stats.js";

export const progressRouter = router({
  roster: adminProcedure.input(z.object({ circleId: z.number() })).query(({ input }) => activeRoster(input.circleId)),
  add: adminProcedure.input(z.object({
    applicantId: z.number(), circleId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    portion: z.string().trim().min(2, "أدخل المقطع المسمَّع"), pages: z.number().min(0).max(604), grade: z.number().int().min(0).max(100).nullable().optional(), notes: z.string().max(1000).optional().nullable(),
  })).mutation(async ({ input: i }) => {
    const roster = await activeRoster(i.circleId);
    if (!roster.some((r) => r.applicantId === i.applicantId)) throw new TRPCError({ code: "BAD_REQUEST", message: "التسميع للطلاب المقيّدين فعليًا في الحلقة فقط" });
    await db.insert(s.progressRecords).values({ applicantId: i.applicantId, circleId: i.circleId, date: i.date, portion: i.portion, pages: Math.round(i.pages), grade: i.grade ?? null, notes: i.notes || null });
    return true;
  }),
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false), circleId: z.number().optional() })).query(({ input: i }) =>
    db.select({
      id: s.progressRecords.id, date: s.progressRecords.date, portion: s.progressRecords.portion, pages: s.progressRecords.pages, grade: s.progressRecords.grade, notes: s.progressRecords.notes,
      student: s.applicants.fullName, circle: s.circles.name,
    }).from(s.progressRecords)
      .innerJoin(s.applicants, eq(s.applicants.id, s.progressRecords.applicantId))
      .innerJoin(s.circles, eq(s.circles.id, s.progressRecords.circleId))
      .where(and(i.archived ? isNotNull(s.progressRecords.archivedAt) : isNull(s.progressRecords.archivedAt), i.circleId ? eq(s.progressRecords.circleId, i.circleId) : undefined))
      .orderBy(desc(s.progressRecords.date), desc(s.progressRecords.id)).limit(300)),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(s.progressRecords).set({ archivedAt: new Date() }).where(eq(s.progressRecords.id, input.id)); return true; }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.update(s.progressRecords).set({ archivedAt: null }).where(eq(s.progressRecords.id, input.id)); return true; }),
});
