import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Trophy, Zap, CalendarRange, UserPlus, Shuffle, CalendarCheck, Mic, Award, Users, BookOpen, UserCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, today } from "@/lib/utils";
import { Card, CardTitle, Button } from "@/components/ui";
import { PageHeader, Loading } from "./shared";

function courseProgress(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const s = new Date(start).getTime(), e = new Date(end).getTime(), n = new Date(today()).getTime();
  const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
  const day = Math.min(days, Math.max(0, Math.round((n - s) / 86400000) + 1));
  return { days, day, pct: Math.round((day / days) * 100) };
}
export default function Dashboard() {
  const { data } = trpc.dashboard.get.useQuery();
  if (!data) return <Loading />;
  const cp = courseProgress(data.course?.startDate, data.course?.endDate);
  const active = data.alerts.filter((a) => a.count > 0);
  return (
    <>
      <PageHeader title="لوحة المتابعة" sub="لمحة سريعة على نشاط المركز" actions={<Button asChild><Link to="/admin/applicants"><UserPlus className="h-4 w-4" />المتقدمون</Link></Button>} />
      <Card className="relative mb-5 overflow-hidden border-gold/30 bg-gradient-to-l from-white to-gold-100/50"><div className="pattern-gold pointer-events-none absolute inset-y-0 left-0 w-1/2 opacity-60 [mask-image:linear-gradient(to_right,black,transparent)]" /><div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><CalendarRange className="h-6 w-6 text-gold" /><div><div className="text-xs text-navy/50">الدورة الافتراضية</div><div className="text-lg font-extrabold">{data.course?.name ?? "لا توجد دورة افتراضية"}</div></div></div>
          {cp && <div className="text-sm text-navy/60">{data.course?.startDate} ← {data.course?.endDate} · اليوم {ar(cp.day)} من {ar(cp.days)}</div>}
        </div>
        {cp && <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-navy/10"><div className="h-full rounded-full bg-gradient-to-l from-gold to-navy transition-all duration-700" style={{ width: `${cp.pct}%` }} /></div>}
      </div></Card>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {([["الطلاب المقيّدون", data.counts.students, Users, "bg-navy text-gold-400"], ["الحلقات النشطة", data.counts.circles, BookOpen, "bg-gold-100 text-gold"], ["المقبولون", data.counts.accepted, UserCheck, "bg-emerald-50 text-emerald-600"]] as const).map(([l, v, I, tone]) => (
          <Card key={l} className="flex items-center gap-4 transition hover:shadow-md">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone}`}><I className="h-6 w-6" /></span>
            <div><div className="text-sm text-navy/55">{l}</div><div className="mt-0.5 text-3xl font-extrabold">{ar(v)}</div></div>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle><AlertTriangle className="h-5 w-5 text-gold" />التنبيهات الذكية</CardTitle>
          {active.length === 0 ? <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" />لا توجد تنبيهات — كل شيء على ما يرام</p> :
            <div className="space-y-2">{active.map((a) => (
              <Link key={a.key} to={a.to} className="flex items-center justify-between rounded-xl bg-ivory px-4 py-3 transition hover:bg-gold-100/60">
                <span className="text-sm font-bold">{a.text}</span><span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-white">{ar(a.count)}</span>
              </Link>))}</div>}
        </Card>
        <Card>
          <CardTitle><Trophy className="h-5 w-5 text-gold" />أعلى الطلاب تسميعًا</CardTitle>
          {data.top.length === 0 ? <p className="text-sm text-navy/50">لم تُرصد تسميعات بعد</p> :
            <ol className="divide-y divide-navy/5">{data.top.map((t, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3"><span className="w-6 text-center">{["🥇", "🥈", "🥉"][i] ?? ar(i + 1)}</span><div><div className="font-bold">{t.name}</div><div className="text-xs text-navy/50">{t.circle}</div></div></div>
                <div className="text-left text-sm"><b>{ar(t.pages)}</b> وجه · {ar(t.recs)} تسميعة</div>
              </li>))}</ol>}
        </Card>
      </div>
      <Card className="mt-5">
        <CardTitle><Zap className="h-5 w-5 text-gold" />إجراءات سريعة</CardTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[["/admin/applicants", "مراجعة الطلبات", UserPlus], ["/admin/distribution", "توزيع الطلاب", Shuffle], ["/admin/attendance", "رصد الحضور", CalendarCheck], ["/admin/progress", "رصد التسميع", Mic], ["/admin/certificates", "إصدار شهادة", Award]].map(([to, l, I]) => {
            const Icon = I as typeof Zap;
            return <Link key={to as string} to={to as string} className="flex flex-col items-center gap-2 rounded-xl border border-navy/10 p-4 text-center text-sm font-bold transition hover:border-gold hover:bg-gold-100/30"><Icon className="h-6 w-6 text-gold" />{l as string}</Link>;
          })}
        </div>
      </Card>
    </>
  );
}
