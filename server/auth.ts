import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "./db.js";

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(adminId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await db.insert(schema.adminSessions).values({ tokenHash: sha(token), adminId, expiresAt });
  return { token, expiresAt };
}
export async function adminFromToken(token?: string | null) {
  if (!token) return null;
  const rows = await db
    .select({ id: schema.admins.id, username: schema.admins.username })
    .from(schema.adminSessions)
    .innerJoin(schema.admins, eq(schema.admins.id, schema.adminSessions.adminId))
    .where(and(eq(schema.adminSessions.tokenHash, sha(token)), gt(schema.adminSessions.expiresAt, new Date())))
    .limit(1);
  return rows[0] ?? null;
}
export async function destroySession(token: string) {
  await db.delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, sha(token)));
}
export async function destroyOtherSessions(adminId: number, keepToken: string) {
  const all = await db.select().from(schema.adminSessions).where(eq(schema.adminSessions.adminId, adminId));
  for (const s of all) if (s.tokenHash !== sha(keepToken)) await db.delete(schema.adminSessions).where(eq(schema.adminSessions.id, s.id));
}
