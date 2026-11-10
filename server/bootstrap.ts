import { count, eq } from "drizzle-orm";
import { db, schema as s } from "./db.js";
import { hashPassword } from "./auth.js";

/** يُنشئ المدير الافتراضي إن لم يوجد أي مدير (لا يغيّر أي بيانات قائمة) */
export async function bootstrap() {
  const [c] = await db.select({ n: count() }).from(s.admins);
  if (Number(c.n) === 0) {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    await db.insert(s.admins).values({ username, passwordHash: hashPassword(password) });
    console.log(`[bootstrap] تم إنشاء المدير الافتراضي: ${username} — غيّر كلمة المرور من الإعدادات`);
  }
  const [cc] = await db.select({ n: count() }).from(s.courses);
  if (Number(cc.n) === 0) {
    await db.insert(s.courses).values({ name: "الدورة الأولى", description: "الدورة الافتراضية", isDefault: true });
  }
  void eq;
}
