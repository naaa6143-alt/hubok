import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db, schema as s } from "../db.js";
import { createSession, destroySession, destroyOtherSessions, hashPassword, verifyPassword } from "../auth.js";

const fails = new Map<string, { n: number; until: number }>();
export const authRouter = router({
  login: publicProcedure.input(z.object({ username: z.string().min(1), password: z.string().min(1) })).mutation(async ({ input }) => {
    const key = input.username.toLowerCase();
    const f = fails.get(key);
    if (f && f.n >= 5 && f.until > Date.now()) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "محاولات كثيرة، حاول بعد دقائق" });
    const [a] = await db.select().from(s.admins).where(eq(s.admins.username, input.username)).limit(1);
    if (!a || !verifyPassword(input.password, a.passwordHash)) {
      const n = (f?.n ?? 0) + 1;
      fails.set(key, { n, until: Date.now() + 5 * 60_000 });
      throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }
    fails.delete(key);
    const { token } = await createSession(a.id);
    return { token, username: a.username };
  }),
  me: publicProcedure.query(({ ctx }) => (ctx.admin ? { username: ctx.admin.username } : null)),
  logout: adminProcedure.mutation(async ({ ctx }) => { await destroySession(ctx.token); return true; }),
  changePassword: adminProcedure.input(z.object({ current: z.string(), next: z.string().min(8, "كلمة المرور 8 أحرف على الأقل") })).mutation(async ({ ctx, input }) => {
    const [a] = await db.select().from(s.admins).where(eq(s.admins.id, ctx.admin.id)).limit(1);
    if (!a || !verifyPassword(input.current, a.passwordHash)) throw new TRPCError({ code: "BAD_REQUEST", message: "كلمة المرور الحالية غير صحيحة" });
    await db.update(s.admins).set({ passwordHash: hashPassword(input.next) }).where(eq(s.admins.id, a.id));
    await destroyOtherSessions(a.id, ctx.token);
    return true;
  }),
});
