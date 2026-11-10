import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routers.js";
import { createContext } from "./trpc.js";
import { bootstrap } from "./bootstrap.js";

/** تهيئة لمرة واحدة لكل نسخة (محليًا أو لكل دالة Serverless عند الإقلاع البارد) */
let ready: Promise<void> | null = null;
export const ensureReady = () => (ready ??= bootstrap().catch((e) => { ready = null; throw e; }));

/** تطبيق الـAPI المشترك بين الخادم المحلي ودالة Vercel */
export function createApi() {
  const app = new Hono();
  app.use("/trpc/*", async (_c, next) => { await ensureReady(); await next(); });
  app.use("/trpc/*", trpcServer({ router: appRouter, endpoint: "/trpc", createContext: (o, c) => createContext(o, c as never) }));
  app.get("/api/health", (c) => c.json({ ok: true }));
  return app;
}
