import { z } from "zod";
import { and, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";

const input = z.object({ name: z.string().trim().min(2, "أدخل اسم الدورة"), description: z.string().optional().nullable(), startDate: z.string().optional().nullable(), endDate: z.string().optional().nullable() });
const dates = (i: z.infer<typeof input>) => ({ name: i.name, description: i.description || null, startDate: i.startDate || null, endDate: i.endDate || null });

async function ensureOneDefault() {
  const defs = await db.select().from(s.courses).where(and(eq(s.courses.isDefault, true), isNull(s.courses.archivedAt))).orderBy(desc(s.courses.id));
  if (defs.length > 1) await db.update(s.courses).set({ isDefault: false }).where(and(eq(s.courses.isDefault, true), ne(s.courses.id, defs[0].id)));
  if (defs.length === 0) {
    const [c] = await db.select().from(s.courses).where(isNull(s.courses.archivedAt)).orderBy(desc(s.courses.id)).limit(1);
    if (c) await db.update(s.courses).set({ isDefault: true }).where(eq(s.courses.id, c.id));
  }
}
export const coursesRouter = router({
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false) })).query(({ input: i }) =>
    db.select().from(s.courses).where(i.archived ? isNotNull(s.courses.archivedAt) : isNull(s.courses.archivedAt)).orderBy(desc(s.courses.isDefault), desc(s.courses.createdAt))),
  create: adminProcedure.input(input).mutation(async ({ input: i }) => {
    await db.insert(s.courses).values(dates(i));
    await ensureOneDefault();
    return true;
  }),
  update: adminProcedure.input(input.extend({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.courses).set(dates(i)).where(eq(s.courses.id, i.id));
    return true;
  }),
  setDefault: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.courses).set({ isDefault: false });
    await db.update(s.courses).set({ isDefault: true, archivedAt: null }).where(eq(s.courses.id, i.id));
    return true;
  }),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.courses).set({ archivedAt: new Date(), isDefault: false }).where(eq(s.courses.id, i.id));
    await ensureOneDefault();
    return true;
  }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => {
    await db.update(s.courses).set({ archivedAt: null }).where(eq(s.courses.id, i.id));
    await ensureOneDefault();
    return true;
  }),
});
