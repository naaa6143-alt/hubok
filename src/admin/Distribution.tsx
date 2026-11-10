import { useState } from "react";
import { ArrowLeftRight, UserCheck, Shuffle, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar } from "@/lib/utils";
import { Badge, Button, Card, CardTitle, Dialog, Field, Select } from "@/components/ui";
import { PageHeader, useAction, Empty, Loading } from "./shared";

export default function Distribution() {
  const a = useAction();
  const { data } = trpc.distribution.state.useQuery();
  const [pick, setPick] = useState<Record<number, string>>({});
  const [move, setMove] = useState<{ enrollmentId: number; name: string; from: number; to: string } | null>(null);
  const assign = trpc.distribution.assign.useMutation({ onSuccess: a.ok("تم توزيع الطالب"), onError: a.err });
  const mv = trpc.distribution.move.useMutation({ onSuccess: () => { setMove(null); a.ok("تم النقل وأُرشف القيد القديم")(); }, onError: a.err });
  const un = trpc.distribution.unassign.useMutation({ onSuccess: a.ok("تم إلغاء القيد (أُرشف)"), onError: a.err });
  if (!data) return <Loading />;
  const avail = data.circles.filter((c) => c.enrolled < c.capacity);
  return (
    <>
      <PageHeader title="التوزيع" sub="وزّع الطلاب المقبولين على الحلقات حسب الطاقة المتاحة" />
      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardTitle><UserCheck className="h-5 w-5 text-gold" />مقبولون بانتظار التوزيع <Badge tone="gold">{ar(data.pending.length)}</Badge></CardTitle>
          {data.pending.length === 0 ? <p className="text-sm text-navy/50">لا يوجد طلاب مقبولون غير موزّعين</p> :
            <div className="divide-y divide-navy/5">{data.pending.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-2 py-3">
                <div className="min-w-[140px] flex-1"><div className="font-bold">{p.name}</div><div className="text-xs text-navy/50">{p.program ?? ""}{p.age ? ` · ${ar(p.age)} سنة` : ""}</div></div>
                <Select className="w-44" value={pick[p.id] ?? ""} onChange={(e) => setPick({ ...pick, [p.id]: e.target.value })}>
                  <option value="">اختر حلقة</option>{avail.map((c) => <option key={c.id} value={c.id}>{c.name} ({ar(c.capacity - c.enrolled)} مقعد)</option>)}
                </Select>
                <Button size="sm" disabled={!pick[p.id]} onClick={() => assign.mutate({ applicantId: p.id, circleId: Number(pick[p.id]) })}><Shuffle className="h-3.5 w-3.5" />توزيع</Button>
              </div>))}</div>}
          {data.circles.length === 0 && <p className="mt-3 rounded-xl bg-gold-100/60 p-3 text-sm">أنشئ حلقة أولًا من صفحة الحلقات.</p>}
        </Card>
        <div className="space-y-4">
          {data.circles.length === 0 ? <Empty text="لا توجد حلقات" /> : data.circles.map((c) => {
            const members = data.enrollments.filter((e) => e.circleId === c.id);
            return <Card key={c.id}>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">{c.name}</h3><Badge tone={c.enrolled >= c.capacity ? "red" : "blue"}>{ar(c.enrolled)} / {ar(c.capacity)}</Badge></div>
              {members.length === 0 ? <p className="text-sm text-navy/40">لا يوجد طلاب</p> :
                <div className="flex flex-wrap gap-2">{members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-ivory py-1 pe-1 ps-3 text-sm">
                    {m.name}
                    <button className="rounded-full p-1 text-navy/50 hover:bg-gold-100 hover:text-navy" title="نقل لحلقة أخرى" onClick={() => setMove({ enrollmentId: m.id, name: m.name, from: c.id, to: "" })}><ArrowLeftRight className="h-3.5 w-3.5" /></button>
                    <button className="rounded-full p-1 text-navy/50 hover:bg-red-50 hover:text-red-600" title="إلغاء القيد (أرشفة)" onClick={() => un.mutate({ enrollmentId: m.id })}><LogOut className="h-3.5 w-3.5" /></button>
                  </span>))}</div>}
            </Card>;
          })}
        </div>
      </div>
      <Dialog open={!!move} onOpenChange={(o) => !o && setMove(null)} title={`نقل ${move?.name ?? ""}`}>
        {move && <div className="space-y-4">
          <Field label="إلى الحلقة" hint="سيُؤرشف القيد القديم تلقائيًا ويبقى سجله محفوظًا"><Select value={move.to} onChange={(e) => setMove({ ...move, to: e.target.value })}><option value="">اختر</option>{avail.filter((c) => c.id !== move.from).map((c) => <option key={c.id} value={c.id}>{c.name} ({ar(c.capacity - c.enrolled)} مقعد)</option>)}</Select></Field>
          <Button className="w-full" disabled={!move.to} loading={mv.isPending} onClick={() => mv.mutate({ enrollmentId: move.enrollmentId, toCircleId: Number(move.to) })}>تأكيد النقل</Button>
        </div>}
      </Dialog>
    </>
  );
}
