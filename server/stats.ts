import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema as s } from "./db.js";

export type StudentStat = { attTotal: number; attOk: number; attPct: number | null; recs: number; pages: number; avgGrade: number | null; lastRec: string | null };

/** إحصاءات كل طالب (حضور + تسميع) من السجلات غير المؤرشفة */
export async function studentStats(): Promise<Map<number, StudentStat>> {
  const att = await db
    .select({
      id: s.attendanceRecords.applicantId,
      total: sql<number>`count(*)`,
      ok: sql<number>`sum(case when ${s.attendanceRecords.status} in ('present','late') then 1 else 0 end)`,
    })
    .from(s.attendanceRecords).where(isNull(s.attendanceRecords.archivedAt)).groupBy(s.attendanceRecords.applicantId);
  const pr = await db
    .select({
      id: s.progressRecords.applicantId,
      recs: sql<number>`count(*)`,
      pages: sql<number>`coalesce(sum(${s.progressRecords.pages}),0)`,
      avg: sql<number | null>`avg(${s.progressRecords.grade})`,
      last: sql<string | null>`max(${s.progressRecords.date})`,
    })
    .from(s.progressRecords).where(isNull(s.progressRecords.archivedAt)).groupBy(s.progressRecords.applicantId);
  const m = new Map<number, StudentStat>();
  const get = (id: number) => {
    if (!m.has(id)) m.set(id, { attTotal: 0, attOk: 0, attPct: null, recs: 0, pages: 0, avgGrade: null, lastRec: null });
    return m.get(id)!;
  };
  for (const a of att) { const g = get(a.id); g.attTotal = Number(a.total); g.attOk = Number(a.ok); g.attPct = g.attTotal ? Math.round((g.attOk / g.attTotal) * 100) : null; }
  for (const p of pr) { const g = get(p.id); g.recs = Number(p.recs); g.pages = Number(p.pages); g.avgGrade = p.avg === null ? null : Math.round(Number(p.avg)); g.lastRec = p.last ? String(p.last).slice(0, 10) : null; }
  return m;
}
export const emptyStat: StudentStat = { attTotal: 0, attOk: 0, attPct: null, recs: 0, pages: 0, avgGrade: null, lastRec: null };

/** الطلاب المقيّدون فعليًا (قيد نشط + طالب غير مؤرشف) */
export async function activeRoster(circleId?: number) {
  const rows = await db
    .select({
      enrollmentId: s.enrollments.id, applicantId: s.applicants.id, name: s.applicants.fullName, phone: s.applicants.phone,
      guardianPhone: s.applicants.guardianPhone, circleId: s.circles.id, circleName: s.circles.name, courseId: s.circles.courseId,
    })
    .from(s.enrollments)
    .innerJoin(s.applicants, eq(s.applicants.id, s.enrollments.applicantId))
    .innerJoin(s.circles, eq(s.circles.id, s.enrollments.circleId))
    .where(and(isNull(s.enrollments.archivedAt), isNull(s.applicants.archivedAt), isNull(s.circles.archivedAt), circleId ? eq(s.enrollments.circleId, circleId) : undefined))
    .orderBy(s.applicants.fullName);
  return rows;
}
