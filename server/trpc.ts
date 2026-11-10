import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { adminFromToken } from "./auth.js";

export async function createContext(_: unknown, c: { req: { header: (n: string) => string | undefined } }) {
  const h = c.req.header("authorization");
  const token = h?.startsWith("Bearer ") ? h.slice(7) : null;
  const admin = await adminFromToken(token);
  return { admin, token };
}
type Ctx = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Ctx>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.admin) throw new TRPCError({ code: "UNAUTHORIZED", message: "يلزم تسجيل الدخول" });
  return next({ ctx: { ...ctx, admin: ctx.admin, token: ctx.token! } });
});
