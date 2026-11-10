import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFileSync, existsSync } from "node:fs";
import { createApi, ensureReady } from "./app.js";

/** خادم Node للتشغيل المحلي أو على VPS (على Vercel تُستخدم api/trpc.ts بدلًا منه) */
const app = createApi();
app.use("/assets/*", serveStatic({ root: "./dist" }));
app.use("/favicon.svg", serveStatic({ root: "./dist" }));
app.get("*", (c) => {
  const p = "./dist/index.html";
  if (!existsSync(p)) return c.text("شغّل npm run build أولًا، أو استخدم npm run dev", 404);
  return c.html(readFileSync(p, "utf8"));
});
await ensureReady();
const port = Number(process.env.PORT || 3000);
serve({ fetch: app.fetch, port }, () => console.log(`حُبُك يعمل على http://localhost:${port}`));
