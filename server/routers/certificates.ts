import { eq, isNull } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { activeRoster, studentStats, emptyStat } from "../stats.js";
import { allSettings } from "./site.js";
import { gradeLabel, todayStr } from "../util.js";

/** بيانات الطلاب المقيّدين مع المتغيرات الجاهزة للشهادات والواتساب */
export const certificatesRouter = router({
  roster: adminProcedure.query(async () => {
    const [roster, stats, cfg, courses] = await Promise.all([activeRoster(), studentStats(), allSettings(), db.select().from(s.courses).where(isNull(s.courses.archivedAt))]);
    const defCourse = courses.find((c) => c.isDefault)?.name ?? "—";
    return {
      settings: Object.fromEntries(Object.entries(cfg).filter(([k]) => k.startsWith("cert_") || k === "wa_template" || k === "center_name")),
      students: roster.map((r) => {
        const st = stats.get(r.applicantId) ?? emptyStat;
        const score = st.avgGrade ?? st.attPct;
        return {
          applicantId: r.applicantId, phone: r.phone, guardianPhone: r.guardianPhone,
          vars: {
            الاسم: r.name, الحلقة: r.circleName, الدورة: courses.find((c) => c.id === r.courseId)?.name ?? defCourse, المركز: cfg.center_name,
            التاريخ: new Intl.DateTimeFormat("ar-SA", { dateStyle: "long", timeZone: "Asia/Riyadh" }).format(new Date(todayStr())),
            نسبة_الحضور: st.attPct === null ? "—" : `${st.attPct}%`, عدد_التسميعات: String(st.recs), التقدير: gradeLabel(score),
          } as Record<string, string>,
        };
      }),
    };
  }),
});
