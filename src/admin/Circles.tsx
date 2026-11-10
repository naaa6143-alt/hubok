import { useState } from "react";
import { Plus, Pencil, BookOpen, UserRound, CalendarRange, ListOrdered } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar } from "@/lib/utils";
import { Badge, Button, Card, Dialog, Field, Input, Select } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction, Empty } from "./shared";

type F = { id?: number; name: string; teacherId: string; courseId: string; curriculumId: string; capacity: string };
const num = (v: string) => (v ? Number(v) : null);
export default function Circles() {
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState<F | null>(null);
  const a = useAction();
  const { data = [] } = trpc.circles.list.useQuery({ archived });
  const opts = trpc.circles.options.useQuery();
  const done = () => { setForm(null); a.ok("تم الحفظ")(); };
  const create = trpc.circles.create.useMutation({ onSuccess: done, onError: a.err });
  const update = trpc.circles.update.useMutation({ onSuccess: done, onError: a.err });
  const arch = trpc.circles.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.circles.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  const save = () => {
    if (!form) return;
    const v = { name: form.name, teacherId: num(form.teacherId), courseId: num(form.courseId), curriculumId: num(form.curriculumId), capacity: Number(form.capacity) || 15 };
    form.id ? update.mutate({ ...v, id: form.id }) : create.mutate(v);
  };
  return (
    <>
      <PageHeader title="الحلقات" sub="أنشئ الحلقات واربطها بمعلم ودورة ومنهج" actions={<Button onClick={() => setForm({ name: "", teacherId: "", courseId: "", curriculumId: "", capacity: "15" })}><Plus className="h-4 w-4" />حلقة جديدة</Button>} />
      <div className="mb-4"><ArchiveSwitch value={archived} onChange={setArchived} /></div>
      {data.length === 0 ? <Empty icon={<BookOpen className="h-8 w-8" />} text={archived ? "الأرشيف فارغ" : "لا توجد حلقات بعد"} /> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((c) => {
          const pct = Math.min(100, Math.round((c.enrolled / c.capacity) * 100));
          return <Card key={c.id}>
            <div className="mb-3 flex items-start justify-between"><h3 className="text-lg font-extrabold">{c.name}</h3><Badge tone={pct >= 100 ? "red" : "green"}>{pct >= 100 ? "ممتلئة" : "متاحة"}</Badge></div>
            <div className="space-y-1.5 text-sm text-navy/70">
              <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-gold" />{c.teacherName ?? <span className="font-bold text-red-600">بلا معلم</span>}</div>
              <div className="flex items-center gap-2"><CalendarRange className="h-4 w-4 text-gold" />{c.courseName ?? "بدون دورة"}</div>
              <div className="flex items-center gap-2"><ListOrdered className="h-4 w-4 text-gold" />{c.curriculumName ?? "بدون منهج"}</div>
            </div>
            <div className="mt-3 flex justify-between text-xs text-navy/55"><span>الطاقة الاستيعابية</span><span>{ar(c.enrolled)} / {ar(c.capacity)}</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy/10"><div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-gold"}`} style={{ width: `${pct}%` }} /></div>
            <div className="mt-4 flex gap-2">
              {!archived && <Button size="sm" variant="ghost" onClick={() => setForm({ id: c.id, name: c.name, teacherId: c.teacherId ? String(c.teacherId) : "", courseId: c.courseId ? String(c.courseId) : "", curriculumId: c.curriculumId ? String(c.curriculumId) : "", capacity: String(c.capacity) })}><Pencil className="h-3.5 w-3.5" />تعديل</Button>}
              <ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: c.id })} onRestore={() => rest.mutate({ id: c.id })} />
            </div>
          </Card>;
        })}</div>}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "تعديل الحلقة" : "حلقة جديدة"}>
        {form && <div className="space-y-4">
          <Field label="اسم الحلقة *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="المعلم" hint={opts.data?.teachers.length ? undefined : "لا يوجد معلمون مقبولون بعد — اقبل معلمًا من صفحة المتقدمين"}>
            <Select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">بدون معلم</option>{opts.data?.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الدورة (اختياري)" hint="تُربط بالافتراضية إن تُركت فارغة"><Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}><option value="">—</option>{opts.data?.courses.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isDefault ? " (افتراضية)" : ""}</option>)}</Select></Field>
            <Field label="المنهج (اختياري)"><Select value={form.curriculumId} onChange={(e) => setForm({ ...form, curriculumId: e.target.value })}><option value="">—</option>{opts.data?.curricula.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          </div>
          <Field label="الطاقة الاستيعابية *"><Input type="number" min={1} max={200} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
          <Button className="w-full" onClick={save} loading={create.isPending || update.isPending}>حفظ</Button>
        </div>}
      </Dialog>
    </>
  );
}
