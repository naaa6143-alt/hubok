import { useState } from "react";
import { Plus, Star, Pencil, CalendarRange } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, today } from "@/lib/utils";
import { Badge, Button, Card, Dialog, Field, Input, Textarea } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction, Empty } from "./shared";

type F = { id?: number; name: string; description: string; startDate: string; endDate: string };
function timeline(s?: string | null, e?: string | null) {
  if (!s || !e) return null;
  const a = new Date(s).getTime(), b = new Date(e).getTime(), n = new Date(today()).getTime();
  if (b < a) return null;
  const pct = n <= a ? 0 : n >= b ? 100 : Math.round(((n - a) / (b - a)) * 100);
  return { pct, label: n < a ? "لم تبدأ" : n > b ? "منتهية" : "جارية" };
}
export default function Courses() {
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState<F | null>(null);
  const a = useAction();
  const { data = [] } = trpc.courses.list.useQuery({ archived });
  const done = () => { setForm(null); a.ok("تم الحفظ")(); };
  const create = trpc.courses.create.useMutation({ onSuccess: done, onError: a.err });
  const update = trpc.courses.update.useMutation({ onSuccess: done, onError: a.err });
  const setDef = trpc.courses.setDefault.useMutation({ onSuccess: a.ok("أصبحت الدورة افتراضية"), onError: a.err });
  const arch = trpc.courses.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.courses.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  const save = () => { if (!form) return; const v = { name: form.name, description: form.description, startDate: form.startDate || null, endDate: form.endDate || null }; form.id ? update.mutate({ ...v, id: form.id }) : create.mutate(v); };
  return (
    <>
      <PageHeader title="الدورات" sub="دورة افتراضية واحدة فقط في كل وقت" actions={<Button onClick={() => setForm({ name: "", description: "", startDate: "", endDate: "" })}><Plus className="h-4 w-4" />دورة جديدة</Button>} />
      <div className="mb-4"><ArchiveSwitch value={archived} onChange={setArchived} /></div>
      {data.length === 0 ? <Empty icon={<CalendarRange className="h-8 w-8" />} text={archived ? "الأرشيف فارغ" : "لا توجد دورات"} /> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.map((c) => {
          const t = timeline(c.startDate, c.endDate);
          return <Card key={c.id} className={c.isDefault ? "border-gold ring-1 ring-gold/40" : ""}>
            <div className="mb-2 flex items-start justify-between gap-2"><h3 className="text-lg font-extrabold">{c.name}</h3>{c.isDefault && <Badge tone="gold"><Star className="ml-1 h-3 w-3 fill-current" />افتراضية</Badge>}</div>
            {c.description && <p className="mb-3 text-sm text-navy/60">{c.description}</p>}
            <div className="text-xs text-navy/50">{c.startDate ?? "—"} ← {c.endDate ?? "—"}</div>
            {t ? <><div className="mt-2 h-2 overflow-hidden rounded-full bg-navy/10"><div className="h-full rounded-full bg-gradient-to-l from-gold to-navy" style={{ width: `${t.pct}%` }} /></div><div className="mt-1 flex justify-between text-xs text-navy/50"><span>{t.label}</span><span>{ar(t.pct)}٪</span></div></> : <div className="mt-2 text-xs text-navy/40">حدّد تاريخي البداية والنهاية لعرض شريط التقدّم</div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {!archived && !c.isDefault && <Button size="sm" variant="gold" onClick={() => setDef.mutate({ id: c.id })}><Star className="h-3.5 w-3.5" />تعيين افتراضية</Button>}
              {!archived && <Button size="sm" variant="ghost" onClick={() => setForm({ id: c.id, name: c.name, description: c.description ?? "", startDate: c.startDate ?? "", endDate: c.endDate ?? "" })}><Pencil className="h-3.5 w-3.5" />تعديل</Button>}
              <ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: c.id })} onRestore={() => rest.mutate({ id: c.id })} />
            </div>
          </Card>;
        })}</div>}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "تعديل الدورة" : "دورة جديدة"}>
        {form && <div className="space-y-4">
          <Field label="اسم الدورة *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="الوصف"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="البداية"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="النهاية"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          </div>
          <Button className="w-full" onClick={save} loading={create.isPending || update.isPending}>حفظ</Button>
        </div>}
      </Dialog>
    </>
  );
}
