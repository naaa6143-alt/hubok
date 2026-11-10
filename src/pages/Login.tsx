import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck } from "lucide-react";
import { trpc, tokenStore } from "@/lib/trpc";
import { Logo } from "./Home";
import { Button, Input, Field } from "@/components/ui";

export default function Login() {
  const nav = useNavigate();
  const utils = trpc.useUtils();
  const [u, setU] = useState(""), [p, setP] = useState(""), [show, setShow] = useState(false), [err, setErr] = useState("");
  const login = trpc.auth.login.useMutation({
    onSuccess: async (r) => { tokenStore.set(r.token); await utils.invalidate(); nav("/admin"); },
    onError: (e) => setErr(e.message),
  });
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* اللوحة الزخرفية */}
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pattern-light pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,178,90,.22),transparent_55%)]" />
        <Link to="/" className="relative"><Logo light /></Link>
        <div className="relative">
          <p className="font-amiri text-5xl font-bold leading-snug">لوحة إدارة<br />الدورات القرآنية</p>
          <div className="mt-6 h-[2px] w-24 rounded-full bg-gradient-to-l from-transparent via-gold-400 to-transparent" />
          <p className="mt-6 max-w-md leading-relaxed text-white/70">تابع المتقدمين والحلقات والحضور والتسميع، وأصدر الشهادات والتقارير من مكان واحد.</p>
        </div>
        <p className="relative font-amiri text-xl text-gold-400">﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</p>
      </aside>

      <main className="relative flex flex-col px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible"><Logo /></Link>
          <Button asChild variant="ghost" size="sm"><Link to="/">الرئيسية<ArrowLeft className="h-4 w-4" /></Link></Button>
        </div>
        <div className="grid flex-1 place-items-center py-10">
          <form onSubmit={(e) => { e.preventDefault(); setErr(""); login.mutate({ username: u.trim(), password: p }); }} className="w-full max-w-sm">
            <div className="mb-8">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gold-100 text-gold"><ShieldCheck className="h-6 w-6" /></div>
              <h1 className="text-3xl font-extrabold">مرحبًا بعودتك</h1>
              <p className="mt-1 text-navy/55">سجّل الدخول للوصول إلى لوحة الإدارة</p>
            </div>
            <div className="space-y-4">
              <Field label="اسم المستخدم"><Input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" dir="ltr" className="h-12" autoFocus /></Field>
              <Field label="كلمة المرور">
                <div className="relative"><Input type={show ? "text" : "password"} value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" dir="ltr" className="h-12 pe-10" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute end-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy" aria-label="إظهار كلمة المرور">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </Field>
              {err && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700">{err}</p>}
              <Button type="submit" className="w-full" size="lg" loading={login.isPending} disabled={!u || !p}><LogIn className="h-4 w-4" />تسجيل الدخول</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
