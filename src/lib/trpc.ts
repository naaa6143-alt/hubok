import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
const KEY = "hubuk_admin_token";
export const tokenStore = {
  get: () => { try { return localStorage.getItem(KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(KEY, t); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};
export const makeClient = () => trpc.createClient({
  links: [httpBatchLink({ url: "/trpc", transformer: superjson, headers: () => { const t = tokenStore.get(); return t ? { Authorization: `Bearer ${t}` } : {}; } })],
});
