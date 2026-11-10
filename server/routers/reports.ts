import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { activeRoster, studentStats, emptyStat } from "../stats.js";
import { todayStr } from "../util.js";

export const reportsRouter = router({
  overview: adminProcedure.query(async () => {
    const roster = await activeRoster();
    const stats = await studentStats();
    const base = new Date(todayStr() + "T00:00:00Z").getTime();
    const dayStr = (k: number) => new Date(base - k * 86400000).toISOString().slice(0, 10);
    const since = dayStr(29);
    const daily = await db.select({
      date: s.attendanceRecords.date, total: sql<number>`count(*)`,
      ok: sql<number>`sum(case when ${s.attendanceRecords.status} in ('present','late') then 1 else 0 end)`,
    }).from(s.attendanceRecords).where(and(isNull(s.attendanceRecords.archivedAt), gte(s.attendanceRecords.date, since))).groupBy(s.attendanceRecords.date);
    const series: { date: string; rate: number; present: number }[] = [];
    for (let k = 29; k >= 0; k--) {
      const d = dayStr(k);
      const row = daily.find((x) => String(x.date).slice(0, 10) === d);
      series.push({ date: d.slice(5), rate: row ? Math.round((Number(row.ok) / Number(row.total)) * 100) : 0, present: row ? Number(row.ok) : 0 });
    }
    const students = roster.map((r) => ({ ...r, ...(stats.get(r.applicantId) ?? emptyStat) }));
    const circles = await db.select().from(s.circles).where(isNull(s.circles.archivedAt));
    const circlePerf = circles.map((c) => {
      const st = students.filter((x) => x.circleId === c.id);
      const withAtt = st.filter((x) => x.attPct !== null);
      return {
        id: c.id, name: c.name, students: st.length,
        attendance: withAtt.length ? Math.round(withAtt.reduce((a, b) => a + (b.attPct ?? 0), 0) / withAtt.length) : 0,
        recitations: st.reduce((a, b) => a + b.recs, 0), pages: st.reduce((a, b) => a + b.pages, 0),
      };
    });
    const ranked = [...students].sort((a, b) => b.pages - a.pages || b.recs - a.recs || (b.attPct ?? 0) - (a.attPct ?? 0));
    const totalAtt = students.reduce((a, b) => a + b.attTotal, 0), okAtt = students.reduce((a, b) => a + b.attOk, 0);
    return {
      totals: { students: students.length, circles: circles.length, recitations: students.reduce((a, b) => a + b.recs, 0), pages: students.reduce((a, b) => a + b.pages, 0), attendanceRate: totalAtt ? Math.round((okAtt / totalAtt) * 100) : 0 },
      series, circlePerf, top: ranked.slice(0, 10).map((x, i) => ({ rank: i + 1, name: x.name, circle: x.circleName, pages: x.pages, recs: x.recs, attPct: x.attPct, avgGrade: x.avgGrade })),
      rows: students.map((x) => ({ name: x.name, circle: x.circleName, attPct: x.attPct, recs: x.recs, pages: x.pages, avgGrade: x.avgGrade })),
      generatedAt: todayStr(),
    };
  }),
});
