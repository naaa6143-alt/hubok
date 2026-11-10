import { useState } from "react";
import { Mic, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, today } from "@/lib/utils";
import { Button, Card, CardTitle, Field, Input, Select, Table, Textarea } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction } from "./shared";

const blank = { applicantId: "", date: today(), portion: "", pages: "1", grade: "", notes: "" };
export default function Progress() {
  const a = useAction();
  const opts = trpc.circles.options.useQuery();
  const [circleId, setCircle] = useState("");
  const [archived, setArchived] = useState(false);
  const [f, setF] = useState(blank);
  const roster = trpc.progress.roster.useQuery({ circleId: Number(circleId) }, { enabled: !!circleId });
  const list = trpc.progress.list.useQuery({ archived, circleId: circleId ? Number(circleId) : undefined });
  const add = trpc.progress.add.useMutation({ onSuccess: () => { setF({ ...blank, date: f.date }); a.ok("تم رصد التسميع")(); }, onError: a.err });
  const arch = trpc.progress.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.progress.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  const submit = () => {
    if (!circleId || !f.applicantId) return a.toast("اختر الحلقة والطالب", "err");
    add.mutate({ circleId: Number(circleId), applicantId: Number(f.applicantId), date: f.date, portion: f.portion, pages: Number(f.pages) || 0, grade: f.grade === "" ? null : Number(f.grade), notes: f.notes });
  };
  const rows = list.data ?? [];
  return (
    <>
      <PageHeader title="التسميع والتقدم" sub="يُرصد التسميع للطلاب المقيّدين فعليًا في الحلقة فقط" />
      <Card className="mb-5">
        <CardTitle><Mic className="h-5 w-5 text-gold" />رصد تسميع جديد</CardTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="الحلقة"><Select value={circleId} onChange={(e) => { setCircle(e.target.value); setF({ ...f, applicantId: "" }); }}><option value="">اختر الحلقة</option>{opts.data?.circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="الطالب"><Select value={f.applicantId} disabled={!circleId} onChange={(e) => setF({ ...f, applicantId: e.target.value })}><option value="">{circleId && roster.data?.length === 0 ? "لا يوجد طلاب مقيّدون" : "اختر الطالب"}</option>{roster.data?.map((r) => <option key={r.applicantId} value={r.applicantId}>{r.name}</option>)}</Select></Field>
          <Field label="التاريخ"><Input type="date" value={f.date} max={today()} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="المقطع المسمَّع *" className="md:col-span-2"><Input value={f.portion} onChange={(e) => setF({ ...f, portion: e.target.value })} placeholder="مثال: سورة البقرة ١–٢٠" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="عدد الأوجه"><Input type="number" min={0} value={f.pages} onChange={(e) => setF({ ...f, pages: e.target.value })} /></Field>
            <Field label="الدرجة /١٠٠"><Input type="number" min={0} max={100} value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} /></Field>
          </div>
          <Field label="ملاحظات" className="md:col-span-3"><Textarea className="min-h-[60px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
        <Button className="mt-4" onClick={submit} loading={add.isPending}><Plus className="h-4 w-4" />رصد التسميع</Button>
      </Card>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">سجل التسميع {circleId ? "— الحلقة المختارة" : ""}</h2><ArchiveSwitch value={archived} onChange={setArchived} /></div>
      <Table head={["التاريخ", "الطالب", "الحلقة", "المقطع", "الأوجه", "الدرجة", ""]} empty={!list.isLoading && rows.length === 0}>
        {rows.map((r) => <tr key={r.id}><td className="whitespace-nowrap text-xs">{r.date}</td><td className="font-bold">{r.student}</td><td className="text-xs">{r.circle}</td><td>{r.portion}{r.notes && <div className="text-xs text-navy/50">{r.notes}</div>}</td><td>{ar(r.pages)}</td><td>{r.grade === null ? "—" : ar(r.grade)}</td>
          <td><ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: r.id })} onRestore={() => rest.mutate({ id: r.id })} /></td></tr>)}
      </Table>
    </>
  );
}
