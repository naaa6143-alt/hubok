import { TRPCError } from "@trpc/server";
export const todayStr = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
/** يطبّع الجوال السعودي إلى 5xxxxxxxx */
export function normPhone(input: string): string {
  let d = input.replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/\D/g, "");
  if (d.startsWith("00966")) d = d.slice(5);
  else if (d.startsWith("966")) d = d.slice(3);
  if (d.startsWith("0")) d = d.slice(1);
  if (!/^5\d{8}$/.test(d)) throw new TRPCError({ code: "BAD_REQUEST", message: "رقم الجوال غير صحيح (مثال: 5xxxxxxxx)" });
  return d;
}
export const optPhone = (v?: string | null) => (v && v.trim() ? normPhone(v) : null);
export function gradeLabel(score: number | null) {
  if (score === null) return "—";
  if (score >= 90) return "ممتاز";
  if (score >= 80) return "جيد جدًا";
  if (score >= 70) return "جيد";
  if (score >= 60) return "مقبول";
  return "يحتاج إلى مراجعة";
}
