import { Download, Printer, Users, BookOpen, Mic, Percent, Trophy, Layers } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { trpc } from "@/lib/trpc";
import { ar, downloadText, toCsv } from "@/lib/utils";
import { Button, Card, CardTitle, Table } from "@/components/ui";
import { PageHeader, Loading } from "./shared";

export default function Reports() {
  const { data } = trpc.reports.overview.useQuery();
  if (!data) return <Loading />;
  const t = data.totals;
  const exportCsv = () => downloadText(`تقرير_حبك_${data.generatedAt}.csv`, toCsv(data.rows.map((r) => ({ "الطالب": r.name, "الحلقة": r.circle, "نسبة_الحضور": r.attPct ?? "", "التسميعات": r.recs, "الأوجه": r.pages, "متوسط_الدرجة": r.avgGrade ?? "" }))));
  return (
    <div className="print-area">
      <div className="print-only mb-6 text-center"><div className="font-amiri text-5xl font-bold">حُبُك</div><div className="text-sm">تقرير المركز — {data.generatedAt}</div></div>
      <PageHeader title="التقارير" sub={`آخر تحديث ${data.generatedAt}`} actions={<>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" />تصدير CSV</Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" />طباعة PDF</Button>
      </>} />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[[Users, "الطلاب المقيّدون", ar(t.students)], [Layers, "الحلقات", ar(t.circles)], [Mic, "التسميعات", ar(t.recitations)], [BookOpen, "الأوجه", ar(t.pages)], [Percent, "نسبة الحضور", `${ar(t.attendanceRate)}٪`]].map(([I, l, v]) => {
          const Icon = I as typeof Users;
          return <Card key={l as string}><Icon className="mb-2 h-5 w-5 text-gold" /><div className="text-xs text-navy/55">{l as string}</div><div className="text-2xl font-extrabold">{v as string}</div></Card>;
        })}
      </div>
      <Card className="mb-5">
        <CardTitle>نسبة الحضور اليومية — آخر ٣٠ يومًا</CardTitle>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#b8932f" stopOpacity={0.45} /><stop offset="100%" stopColor="#b8932f" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#13293d14" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#13293d99" }} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#13293d99" }} unit="%" />
              <Tooltip formatter={(v) => [`${v}%`, "الحضور"]} labelStyle={{ fontFamily: "Tajawal" }} contentStyle={{ borderRadius: 12, fontFamily: "Tajawal" }} />
              <Area type="monotone" dataKey="rate" stroke="#13293d" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <div><h3 className="mb-3 font-extrabold">أداء الحلقات</h3>
          <Table head={["الحلقة", "الطلاب", "الحضور", "التسميعات", "الأوجه"]} empty={data.circlePerf.length === 0}>
            {data.circlePerf.map((c) => <tr key={c.id}><td className="font-bold">{c.name}</td><td>{ar(c.students)}</td>
              <td><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-navy/10"><div className="h-full bg-gold" style={{ width: `${c.attendance}%` }} /></div>{ar(c.attendance)}٪</div></td>
              <td>{ar(c.recitations)}</td><td>{ar(c.pages)}</td></tr>)}
          </Table></div>
        <div><h3 className="mb-3 flex items-center gap-2 font-extrabold"><Trophy className="h-5 w-5 text-gold" />قائمة الأوائل</h3>
          <Table head={["#", "الطالب", "الحلقة", "الأوجه", "التسميعات", "الحضور"]} empty={data.top.length === 0}>
            {data.top.map((s) => <tr key={s.rank}><td>{["🥇", "🥈", "🥉"][s.rank - 1] ?? ar(s.rank)}</td><td className="font-bold">{s.name}</td><td className="text-xs">{s.circle}</td><td>{ar(s.pages)}</td><td>{ar(s.recs)}</td><td>{s.attPct === null ? "—" : `${ar(s.attPct)}٪`}</td></tr>)}
          </Table></div>
      </div>
    </div>
  );
}
