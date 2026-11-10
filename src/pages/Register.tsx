import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, CheckCircle2, UserRound, BookOpenCheck, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SiteHeader } from "./Home";
import { Button, Input, Select, Textarea, Field } from "@/components/ui";
import { cn, waNumber } from "@/lib/utils";

const empty = { fullName: "", phone: "", guardianPhone: "", email: "", gender: "", age: "", city: "", program: "", notes: "" };
export default function Register() {
  const [kind, setKind] = useState<"student" | "teacher">("student");
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const { data: cfg } = trpc.site.settings.useQuery();
  const programs: { title: string }[] = (() => { try { return JSON.parse(cfg?.programs ?? "[]"); } catch { return []; } })();
  const reg = trpc.applicants.register.useMutation({ onSuccess: (r) => { if (!r.ok) return setErr(r.error); setDone(true); setF(empty); }, onError: (e) => setErr(e.message) });
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (f.fullName.trim().length < 3) return setErr("أدخل الاسم الكامل");
    if (!waNumber(f.phone)) return setErr("رقم الجوال غير صحيح (مثال: 5xxxxxxxx)");
    if (kind === "student" && f.guardianPhone.trim() && !waNumber(f.guardianPhone)) return setErr("جوال ولي الأمر غير صحيح");
    reg.mutate({
      kind, fullName: f.fullName, phone: f.phone, guardianPhone: kind === "student" ? f.guardianPhone : null, email: f.email,
      gender: (f.gender || null) as "male" | "female" | null, age: f.age ? Number(f.age) : null, city: f.city, program: f.program, notes: f.notes,
    });
  };

  return (
    <div className="relative min-h-screen">
      <div className="pattern-gold pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <SiteHeader minimal />
      <main className="relative mx-auto max-w-2xl px-4 py-10 md:py-14">
        <div className="mb-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy text-gold-400 shadow-lg shadow-navy/20"><GraduationCap className="h-7 w-7" /></div>
          <h1 className="mt-4 font-amiri text-4xl font-bold md:text-5xl">التسجيل في حُبُك</h1>
          <p className="mt-2 text-navy/60">املأ النموذج وسيتواصل معك فريق القبول خلال أيام</p>
        </div>
        <div className="rounded-3xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/[.06] md:p-8">
          {done ? (
            <div className="py-10 text-center">
              <div className="mx-auto grid h-20 w-20 animate-rise place-items-center rounded-full bg-emerald-50"><CheckCircle2 className="h-11 w-11 text-emerald-600" /></div>
              <h2 className="mt-4 text-2xl font-extrabold">تم استلام طلبك بنجاح</h2>
              <p className="mt-2 text-navy/60">سيتواصل معك فريق القبول والتسجيل قريبًا بإذن الله.</p>
              <div className="mt-6 flex justify-center gap-3"><Button onClick={() => setDone(false)}>تسجيل آخر</Button><Button asChild variant="outline"><Link to="/">الرئيسية</Link></Button></div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="نوع التسجيل">
                {(["student", "teacher"] as const).map((k) => {
                  const I = k === "student" ? UserRound : BookOpenCheck;
                  return (
                    <button type="button" role="radio" aria-checked={kind === k} key={k} onClick={() => setKind(k)} className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition sm:flex-row sm:gap-3 sm:p-4 sm:text-start", kind === k ? "border-gold bg-gold-100/50" : "border-navy/10 hover:border-navy/25")}>
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", kind === k ? "bg-gold text-white" : "bg-navy/5 text-navy/50")}><I className="h-5 w-5" /></span>
                      <span><span className="block font-extrabold">{k === "student" ? "طالب" : "معلم"}<span className="hidden sm:inline">{k === "student" ? " / طالبة" : " / معلمة"}</span></span><span className="block text-xs text-navy/55">{k === "student" ? "للالتحاق بالحلقات" : "للانضمام لهيئة التعليم"}</span></span>
                    </button>
                  );
                })}
              </div>
              <Field label="الاسم الكامل *"><Input value={f.fullName} onChange={set("fullName")} placeholder="مثال: عبدالله محمد الحربي" autoComplete="name" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="رقم الجوال *"><PhoneInput value={f.phone} onChange={set("phone")} /></Field>
                {kind === "student" && <Field label="جوال ولي الأمر" hint="ليصله تنبيهات الحضور والتقدم عبر واتساب"><PhoneInput value={f.guardianPhone} onChange={set("guardianPhone")} /></Field>}
                <Field label="البريد الإلكتروني"><Input type="email" dir="ltr" value={f.email} onChange={set("email")} placeholder="example@mail.com" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="الجنس"><Select value={f.gender} onChange={set("gender")}><option value="">اختر</option><option value="male">ذكر</option><option value="female">أنثى</option></Select></Field>
                <Field label="العمر"><Input type="number" min={3} max={100} value={f.age} onChange={set("age")} placeholder="15" /></Field>
                <Field label="المدينة"><Input value={f.city} onChange={set("city")} placeholder="الرياض" /></Field>
              </div>
              <Field label="البرنامج المطلوب"><Select value={f.program} onChange={set("program")}><option value="">اختر البرنامج</option>{programs.map((p) => <option key={p.title}>{p.title}</option>)}</Select></Field>
              <Field label="ملاحظات إضافية"><Textarea value={f.notes} onChange={set("notes")} placeholder="أي معلومات تودّ إخبارنا بها…" /></Field>
              {err && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{err}</p>}
              <Button type="submit" size="lg" className="w-full" loading={reg.isPending}>إرسال الطلب</Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-navy/50"><ShieldCheck className="h-3.5 w-3.5" />بإرسال الطلب أنت توافق على التواصل معك عبر رقم الجوال المسجّل</p>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
export function PhoneInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <div className="flex overflow-hidden rounded-xl border border-navy/15 bg-white focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20" dir="ltr">
    <span className="grid place-items-center bg-navy/5 px-3 text-sm font-bold text-navy/60">+966</span>
    <input {...p} type="tel" inputMode="numeric" placeholder="5xxxxxxxx" className="w-full px-3 py-2.5 text-sm outline-none" />
  </div>;
}
