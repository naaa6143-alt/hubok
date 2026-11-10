import { handle } from "hono/vercel";
import { createApi } from "../server/app.js";

/** دالة Vercel: كل طلبات /trpc/* تُوجَّه إلى هنا عبر vercel.json */
const app = createApi();
export const GET = handle(app);
export const POST = handle(app);
