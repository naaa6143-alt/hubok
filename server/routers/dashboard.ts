import { and, eq, isNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { activeRoster, studentStats } from "../stats.js";
import { todayStr } from "../util.js";

export const dashboardRouter = router({
  get: adminProcedure.query(async () => {
    const [newApps] = await db.select({ n: sql<number>`count(*)` }).from(s.applicants).where(and(eq(s.applicants.status, "new"), isNull(s.applicants.archivedAt)));
    const accepted = await db.select({ id: s.applicants.id }).from(s.applicants).where(and(eq(s.applicants.kind, "student"), eq(s.applicants.status, "accepted"), isNull(s.applicants.archivedAt)));
    const roster = await activeRoster();
    const enrolled = new Set(roster.map((r) => r.applicantId));
    const undistributed = accepted.filter((a) => !enrolled.has(a.id)).length;
    const circles = await db.select().from(s.circles).where(isNull(s.circles.archivedAt));
    const noTeacher = circles.filter((c) => !c.teacherId);
    const stats = await studentStats();
    const limit = new Date(new Date(todayStr() + "T00:00:00Z").getTime() - 14 * 86400000).toISOString().slice(0, 10);
    const stale = roster.filter((r) => { const l = stats.get(r.applicantId)?.lastRec; return !l || l < limit; });
    const top = roster.map((r) => ({ name: r.name, circle: r.circleName, recs: stats.get(r.applicantId)?.recs ?? 0, pages: stats.get(r.applicantId)?.pages ?? 0 }))
      .sort((a, b) => b.pages - a.pages || b.recs - a.recs).slice(0, 5);
    const [course] = await db.select().from(s.courses).where(and(eq(s.courses.isDefault, true), isNull(s.courses.archivedAt))).limit(1);
    return {
      alerts: [
        { key: "new", count: Number(newApps.n), text: "طلبات تسجيل جديدة بانتظار المراجعة", to: "/admin/applicants" },
        { key: "undist", count: undistributed, text: "طلاب مقبولون لم يُوزَّعوا على حلقات", to: "/admin/distribution" },
        { key: "noteacher", count: noTeacher.length, text: "حلقات بلا معلم", to: "/admin/circles" },
        { key: "stale", count: stale.length, text: "طلاب بلا تسميع منذ ١٤ يومًا", to: "/admin/progress" },
      ],
      counts: { students: roster.length, circles: circles.length, accepted: accepted.length },
      top, course: course ?? null,
    };
  }),
});
