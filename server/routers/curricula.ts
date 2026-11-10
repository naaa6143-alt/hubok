import { z } from "zod";
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";

export const curriculaRouter = router({
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false) })).query(async ({ input: i }) => {
    const cur = await db.select().from(s.curricula).where(i.archived ? isNotNull(s.curricula.archivedAt) : isNull(s.curricula.archivedAt)).orderBy(desc(s.curricula.createdAt));
    const items = await db.select().from(s.curriculumItems).orderBy(asc(s.curriculumItems.position), asc(s.curriculumItems.id));
    return cur.map((c) => ({ ...c, items: items.filter((x) => x.curriculumId === c.id) }));
  }),
  create: adminProcedure.input(z.object({ name: z.string().trim().min(2, "أدخل اسم المنهج"), description: z.string().optional().nullable() })).mutation(async ({ input: i }) => { await db.insert(s.curricula).values({ name: i.name, description: i.description || null }); return true; }),
  update: adminProcedure.input(z.object({ id: z.number(), name: z.string().trim().min(2), description: z.string().optional().nullable() })).mutation(async ({ input: i }) => { await db.update(s.curricula).set({ name: i.name, description: i.description || null }).where(eq(s.curricula.id, i.id)); return true; }),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.curricula).set({ archivedAt: new Date() }).where(eq(s.curricula.id, i.id)); return true; }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.curricula).set({ archivedAt: null }).where(eq(s.curricula.id, i.id)); return true; }),
  addItem: adminProcedure.input(z.object({ curriculumId: z.number(), title: z.string().trim().min(1, "أدخل عنوان العنصر"), description: z.string().optional().nullable() })).mutation(async ({ input: i }) => {
    const [m] = await db.select({ m: sql<number>`coalesce(max(${s.curriculumItems.position}),0)` }).from(s.curriculumItems).where(eq(s.curriculumItems.curriculumId, i.curriculumId));
    await db.insert(s.curriculumItems).values({ curriculumId: i.curriculumId, title: i.title, description: i.description || null, position: Number(m.m) + 1 });
    return true;
  }),
  updateItem: adminProcedure.input(z.object({ id: z.number(), title: z.string().trim().min(1), description: z.string().optional().nullable() })).mutation(async ({ input: i }) => { await db.update(s.curriculumItems).set({ title: i.title, description: i.description || null }).where(eq(s.curriculumItems.id, i.id)); return true; }),
  archiveItem: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.curriculumItems).set({ archivedAt: new Date() }).where(eq(s.curriculumItems.id, i.id)); return true; }),
  restoreItem: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.curriculumItems).set({ archivedAt: null }).where(eq(s.curriculumItems.id, i.id)); return true; }),
  moveItem: adminProcedure.input(z.object({ id: z.number(), dir: z.enum(["up", "down"]) })).mutation(async ({ input: i }) => {
    const [it] = await db.select().from(s.curriculumItems).where(eq(s.curriculumItems.id, i.id)).limit(1);
    if (!it) return false;
    const list = await db.select().from(s.curriculumItems).where(and(eq(s.curriculumItems.curriculumId, it.curriculumId), isNull(s.curriculumItems.archivedAt))).orderBy(asc(s.curriculumItems.position), asc(s.curriculumItems.id));
    const idx = list.findIndex((x) => x.id === it.id);
    const j = i.dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= list.length) return false;
    [list[idx], list[j]] = [list[j], list[idx]];
    for (let k = 0; k < list.length; k++) await db.update(s.curriculumItems).set({ position: k + 1 }).where(eq(s.curriculumItems.id, list[k].id));
    return true;
  }),
});
