import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { activeRoster } from "../stats.js";

const status = z.enum(["present", "late", "absent", "excused"]);
export const attendanceRouter = router({
  get: adminProcedure.input(z.object({ circleId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ input: i }) => {
    const roster = await activeRoster(i.circleId);
    const recs = await db.select().from(s.attendanceRecords).where(and(eq(s.attendanceRecords.circleId, i.circleId), eq(s.attendanceRecords.date, i.date), isNull(s.attendanceRecords.archivedAt)));
    return roster.map((r) => ({ applicantId: r.applicantId, name: r.name, status: recs.find((x) => x.applicantId === r.applicantId)?.status ?? null }));
  }),
  save: adminProcedure.input(z.object({ circleId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), records: z.array(z.object({ applicantId: z.number(), status })) })).mutation(async ({ input: i }) => {
    const roster = await activeRoster(i.circleId);
    const ok = new Set(roster.map((r) => r.applicantId));
    for (const r of i.records) {
      if (!ok.has(r.applicantId)) throw new TRPCError({ code: "BAD_REQUEST", message: "يوجد طالب غير مقيّد في هذه الحلقة" });
      await db.insert(s.attendanceRecords).values({ applicantId: r.applicantId, circleId: i.circleId, date: i.date, status: r.status })
        .onConflictDoUpdate({ target: [s.attendanceRecords.applicantId, s.attendanceRecords.circleId, s.attendanceRecords.date], set: { status: r.status, archivedAt: null } });
    }
    return { saved: i.records.length };
  }),
});
