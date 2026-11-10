import { z } from "zod";
import { desc, eq, isNotNull, isNull } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";

const input = z.object({ name: z.string().trim().min(2, "أدخل الاسم"), role: z.string().optional().nullable(), phone: z.string().optional().nullable(), bio: z.string().optional().nullable() });
const v = (i: z.infer<typeof input>) => ({ name: i.name, role: i.role || null, phone: i.phone || null, bio: i.bio || null });
export const teamRouter = router({
  public: publicProcedure.query(() => db.select({ id: s.teamMembers.id, name: s.teamMembers.name, role: s.teamMembers.role, bio: s.teamMembers.bio }).from(s.teamMembers).where(isNull(s.teamMembers.archivedAt)).orderBy(s.teamMembers.id)),
  list: adminProcedure.input(z.object({ archived: z.boolean().default(false) })).query(({ input: i }) => db.select().from(s.teamMembers).where(i.archived ? isNotNull(s.teamMembers.archivedAt) : isNull(s.teamMembers.archivedAt)).orderBy(desc(s.teamMembers.createdAt))),
  create: adminProcedure.input(input).mutation(async ({ input: i }) => { await db.insert(s.teamMembers).values(v(i)); return true; }),
  update: adminProcedure.input(input.extend({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.teamMembers).set(v(i)).where(eq(s.teamMembers.id, i.id)); return true; }),
  archive: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.teamMembers).set({ archivedAt: new Date() }).where(eq(s.teamMembers.id, i.id)); return true; }),
  restore: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input: i }) => { await db.update(s.teamMembers).set({ archivedAt: null }).where(eq(s.teamMembers.id, i.id)); return true; }),
});
