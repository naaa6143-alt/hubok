import { useEffect, useState } from "react";
import { CalendarCheck, CheckCheck, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, cn, today } from "@/lib/utils";
import { Button, Card, Field, Input, Select, Table } from "@/components/ui";
import { PageHeader, useAction, Empty } from "./shared";

type St = "present" | "late" | "absent" | "excused";
const OPTS: [St, string, string][] = [["present", "حاضر", "bg-emerald-600"], ["late", "متأخر", "bg-amber-500"], ["absent", "غائب", "bg-red-600"], ["excused", "مستأذن", "bg-sky-600"]];
export default function Attendance() {
  const a = useAction();
  const opts = trpc.circles.options.useQuery();
  const [circleId, setCircle] = useState("");
  const [date, setDate] = useState(today());
  const q = trpc.attendance.get.useQuery({ circleId: Number(circleId), date }, { enabled: !!circleId });
  const [marks, setMarks] = useState<Record<number, St>>({});
  useEffect(() => { if (q.data) setMarks(Object.fromEntries(q.data.filter((r) => r.status).map((r) => [r.applicantId, r.status as St]))); }, [q.data]);
  const save = trpc.attendance.save.useMutation({ onSuccess: (r) => a.ok(`تم حفظ حضور ${ar(r.saved)} طالب`)(), onError: a.err });
  const rows = q.data ?? [];
  const counts = OPTS.map(([k, l]) => [l, Object.values(marks).filter((v) => v === k).length] as const);
  return (
    <>
      <PageHeader title="الحضور" sub="سجل واحد لكل طالب في الحلقة لكل يوم — إعادة الحفظ تحدّث السجل" />
      <Card className="mb-5"><div className="grid gap-4 sm:grid-cols-2">
        <Field label="الحلقة"><Select value={circleId} onChange={(e) => setCircle(e.target.value)}><option value="">اختر الحلقة</option>{opts.data?.circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="التاريخ"><Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field>
      </div></Card>
      {!circleId ? <Empty icon={<CalendarCheck className="h-8 w-8" />} text="اختر الحلقة والتاريخ لرصد الحضور" /> :
        rows.length === 0 && !q.isLoading ? <Empty text="لا يوجد طلاب مقيّدون في هذه الحلقة — وزّعهم من صفحة التوزيع" /> : <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setMarks(Object.fromEntries(rows.map((r) => [r.applicantId, "present" as St])))}><CheckCheck className="h-4 w-4" />تحضير الجميع</Button>
            <div className="flex flex-wrap gap-3 text-sm text-navy/60">{counts.map(([l, n]) => <span key={l}>{l}: <b>{ar(n)}</b></span>)}<span>لم يُرصد: <b>{ar(rows.length - Object.keys(marks).length)}</b></span></div>
          </div>
          <Table head={["الطالب", "الحالة"]}>
            {rows.map((r) => <tr key={r.applicantId}><td className="font-bold">{r.name}</td><td><div className="flex flex-wrap gap-1.5">
              {OPTS.map(([k, l, c]) => <button key={k} onClick={() => setMarks({ ...marks, [r.applicantId]: k })} className={cn("rounded-lg border px-3 py-1.5 text-xs font-bold transition", marks[r.applicantId] === k ? `${c} border-transparent text-white` : "border-navy/15 text-navy/60 hover:bg-navy/5")}>{l}</button>)}
            </div></td></tr>)}
          </Table>
          <Button className="mt-4" size="lg" disabled={!Object.keys(marks).length} loading={save.isPending} onClick={() => save.mutate({ circleId: Number(circleId), date, records: Object.entries(marks).map(([id, status]) => ({ applicantId: Number(id), status })) })}><Save className="h-4 w-4" />حفظ الحضور</Button>
        </>}
    </>
  );
}
