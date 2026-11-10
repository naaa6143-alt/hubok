import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull, ilike, or } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { normPhone, optPhone } from "../util.js";

const base = z.object({
  kind: z.enum(["student", "teacher"]),
  fullName: z.string().trim().min(3, "أدخل الاسم الكامل").max(200),
  phone: z.string().min(1, "أدخل رقم الجوال"),
  guardianPhone: z.string().optional().nullable(),
  email: z.string().email("بريد غير صحيح").optional().or(z.literal("")).nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  age: z.number().int().min(3).max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  program: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
const clean = (i: z.infer<typeof base>) => ({
  kind: i.kind, fullName: i.fullName, phone: normPhone(i.phone),
  guardianPhone: i.kind === "student" ? optPhone(i.guardianPhone) : null,
  email: i.email || null, gender: i.gender ?? null, age: i.age ?? null,
  city: i.city?.trim() || null, program: i.program?.trim() || null, notes: i.notes?.trim() || null,
});
async function exists(phone: string, kind: "student" | "teacher") {
  const [r] = await db.select({ id: s.applicants.id }).from(s.applicants).where(and(eq(s.applicants.phone, phone), eq(s.applicants.kind, kind))).limit(1);
  return !!r;
}

export const applicantsRouter = router({
  register: publicProcedure.input(base).mutation(async ({ input }) => {
    // أخطاء العمل المتوقعة تُعاد كنتيجة (لا كخطأ HTTP) حتى لا تظهر أخطاء في console الزائر
    let v;
    try { v = clean(input); } catch (e) { return { ok: false as const, error: (e as Error).message }; }
    if (await exists(v.phone, v.kind)) return { ok: false as const, error: "هذا الرقم مسجّل لدينا مسبقًا" };
    await db.insert(s.applicants).values(v);
    return { ok: true as const, error: null };
  }),
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false), status: z.enum(["new", "accepted", "rejected"]).optional(), kind: z.enum(["student", "teacher"]).optional(), q: z.string().optional() })).query(({ input }) =>
    db.select().from(s.applicants).where(and(
      input.archived ? isNotNull(s.applicants.archivedAt) : isNull(s.applicants.archivedAt),
      input.status ? eq(s.applicants.status, input.status) : undefined,
      input.kind ? eq(s.applicants.kind, input.kind) : undefined,
      input.q ? or(ilike(s.applicants.fullName, `%${input.q}%`), ilike(s.applicants.phone, `%${input.q}%`)) : undefined,
    )).orderBy(desc(s.applicants.createdAt))),
  create: adminProcedure.input(base).mutation(async ({ input }) => {
    const v = clean(input);
    if (await exists(v.phone, v.kind)) throw new TRPCError({ code: "CONFLICT", message: "الرقم مسجّل مسبقًا" });
    await db.insert(s.applicants).values({ ...v, status: "accepted" });
    return true;
  }),
  update: adminProcedure.input(base.extend({ id: z.number() })).mutation(async ({ input }) => {
    const { id, ...rest } = input;
    const v = clean(rest);
    const [dup] = await db.select({ id: s.applicants.id }).from(s.applicants).where(and(eq(s.applicants.phone, v.phone), eq(s.applicants.kind, v.kind))).limit(1);
    if (dup && dup.id !== id) throw new TRPCError({ code: "CONFLICT", message: "الرقم مستخدم لمتقدم آخر" });
    await db.update(s.applicants).set(v).where(eq(s.applicants.id, id));
    return true;
  }),
  setStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["new", "accepted", "rejected"]) })).mutation(async ({ input }) => {
    await db.update(s.applicants).set({ status: input.status }).where(eq(s.applicants.id, input.id));
    // عند الرفض يُؤرشف قيده الحالي (إن وجد) حتى لا يشغل مقعدًا
    if (input.status === "rejected") await db.update(s.enrollments).set({ archivedAt: new Date() }).where(and(eq(s.enrollments.applicantId, input.id), isNull(s.enrollments.archivedAt)));
    return true;
  }),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const now = new Date();
    await db.update(s.applicants).set({ archivedAt: now }).where(eq(s.applicants.id, input.id));
    await db.update(s.enrollments).set({ archivedAt: now }).where(and(eq(s.enrollments.applicantId, input.id), isNull(s.enrollments.archivedAt)));
    return true;
  }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.update(s.applicants).set({ archivedAt: null }).where(eq(s.applicants.id, input.id));
    return true;
  }),
  importCsv: adminProcedure.input(z.object({ rows: z.array(z.record(z.string(), z.string())).max(2000) })).mutation(async ({ input }) => {
    let inserted = 0, skipped = 0, invalid = 0;
    for (const r of input.rows) {
      try {
        const kind = /معلم|teacher/i.test(r.kind ?? r["النوع"] ?? "") ? "teacher" : "student";
        const g = (r.gender ?? r["الجنس"] ?? "").trim();
        const parsed = base.parse({
          kind, fullName: r.fullName ?? r["الاسم"] ?? "", phone: r.phone ?? r["الجوال"] ?? "",
          guardianPhone: r.guardianPhone ?? r["جوال_ولي_الأمر"] ?? null, email: r.email ?? r["البريد"] ?? "",
          gender: /أنثى|female/i.test(g) ? "female" : /ذكر|male/i.test(g) ? "male" : null,
          age: Number(r.age ?? r["العمر"]) || null, city: r.city ?? r["المدينة"] ?? null,
          program: r.program ?? r["البرنامج"] ?? null, notes: r.notes ?? r["ملاحظات"] ?? null,
        });
        const v = clean(parsed);
        if (await exists(v.phone, v.kind)) { skipped++; continue; }
        await db.insert(s.applicants).values(v);
        inserted++;
      } catch { invalid++; }
    }
    return { inserted, skipped, invalid };
  }),
});
