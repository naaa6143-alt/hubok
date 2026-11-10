import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { DEFAULT_SETTINGS } from "../defaults.js";

export async function allSettings() {
  const rows = await db.select().from(s.siteSettings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}
export const siteRouter = router({
  settings: publicProcedure.query(allSettings),
  stats: publicProcedure.query(async () => {
    const cfg = await allSettings();
    const [st] = await db.select({ n: sql<number>`count(*)` }).from(s.applicants).where(and(eq(s.applicants.kind, "student"), eq(s.applicants.status, "accepted"), isNull(s.applicants.archivedAt)));
    const [te] = await db.select({ n: sql<number>`count(*)` }).from(s.applicants).where(and(eq(s.applicants.kind, "teacher"), eq(s.applicants.status, "accepted"), isNull(s.applicants.archivedAt)));
    const [ci] = await db.select({ n: sql<number>`count(*)` }).from(s.circles).where(isNull(s.circles.archivedAt));
    const [pg] = await db.select({ n: sql<number>`coalesce(sum(${s.progressRecords.pages}),0)` }).from(s.progressRecords).where(isNull(s.progressRecords.archivedAt));
    const pick = (override: string, live: number) => (override.trim() !== "" && !isNaN(Number(override)) ? Number(override) : Number(live));
    return {
      students: pick(cfg.stat_students, st.n), teachers: pick(cfg.stat_teachers, te.n),
      circles: pick(cfg.stat_circles, ci.n), pages: pick(cfg.stat_pages, pg.n),
    };
  }),
  updateSettings: adminProcedure.input(z.record(z.string().max(100), z.string().max(8000))).mutation(async ({ input }) => {
    for (const [key, value] of Object.entries(input)) {
      await db.insert(s.siteSettings).values({ key, value }).onConflictDoUpdate({ target: s.siteSettings.key, set: { value } });
    }
    return true;
  }),
});
