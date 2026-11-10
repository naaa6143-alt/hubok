import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL غير مضبوط");

/**
 * اتصال PostgreSQL (Supabase).
 * - prepare:false مطلوب مع مُجمّع الاتصالات Supavisor (وضع transaction، المنفذ 6543)
 * - max صغير لأن كل دالة Serverless على Vercel تفتح اتصالاتها الخاصة
 */
const client = postgres(url, {
  prepare: false,
  max: process.env.VERCEL ? 1 : 10,
  idle_timeout: 20,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
});
export const db = drizzle(client, { schema });
export { schema };
