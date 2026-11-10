import { useState } from "react";
import { Plus, Pencil, ArrowUp, ArrowDown, ListOrdered, Archive, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar } from "@/lib/utils";
import { Button, Card, Dialog, Field, Input, Textarea } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction, Empty } from "./shared";

export default function Curricula() {
  const a = useAction();
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState<{ id?: number; name: string; description: string } | null>(null);
  const [item, setItem] = useState<{ id?: number; curriculumId: number; title: string; description: string } | null>(null);
  const [showArchivedItems, setSAI] = useState(false);
  const { data = [] } = trpc.curricula.list.useQuery({ archived });
  const done = () => { setForm(null); setItem(null); a.ok("تم الحفظ")(); };
  const create = trpc.curricula.create.useMutation({ onSuccess: done, onError: a.err });
  const update = trpc.curricula.update.useMutation({ onSuccess: done, onError: a.err });
  const arch = trpc.curricula.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.curricula.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  const addItem = trpc.curricula.addItem.useMutation({ onSuccess: done, onError: a.err });
  const updItem = trpc.curricula.updateItem.useMutation({ onSuccess: done, onError: a.err });
  const archItem = trpc.curricula.archiveItem.useMutation({ onSuccess: a.ok("أُرشف العنصر"), onError: a.err });
  const restItem = trpc.curricula.restoreItem.useMutation({ onSuccess: a.ok("استُرجع العنصر"), onError: a.err });
  const moveItem = trpc.curricula.moveItem.useMutation({ onSuccess: a.ok("تم الترتيب"), onError: a.err });
  return (
    <>
      <PageHeader title="المناهج" sub="مناهج بعناصر مرتبة يمكن ربطها بالحلقات" actions={<Button onClick={() => setForm({ name: "", description: "" })}><Plus className="h-4 w-4" />منهج جديد</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-4"><ArchiveSwitch value={archived} onChange={setArchived} />
        <label className="flex items-center gap-2 text-sm text-navy/60"><input type="checkbox" checked={showArchivedItems} onChange={(e) => setSAI(e.target.checked)} />إظهار العناصر المؤرشفة</label></div>
      {data.length === 0 ? <Empty icon={<ListOrdered className="h-8 w-8" />} text={archived ? "الأرشيف فارغ" : "لا توجد مناهج"} /> :
        <div className="grid gap-4 lg:grid-cols-2">{data.map((c) => {
          const items = c.items.filter((i) => showArchivedItems || !i.archivedAt);
          const activeItems = c.items.filter((i) => !i.archivedAt);
          return <Card key={c.id}>
            <div className="mb-1 flex items-start justify-between gap-2"><h3 className="text-lg font-extrabold">{c.name}</h3><span className="text-xs text-navy/50">{ar(activeItems.length)} عنصر</span></div>
            {c.description && <p className="mb-3 text-sm text-navy/60">{c.description}</p>}
            <ol className="mb-4 space-y-1.5">{items.map((it) => {
              const idx = activeItems.findIndex((x) => x.id === it.id);
              return <li key={it.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${it.archivedAt ? "bg-navy/5 opacity-60" : "bg-ivory"}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">{it.archivedAt ? "–" : ar(idx + 1)}</span>
                <div className="min-w-0 flex-1"><div className="text-sm font-bold">{it.title}</div>{it.description && <div className="text-xs text-navy/50">{it.description}</div>}</div>
                {!archived && (it.archivedAt
                  ? <button className="rounded p-1 text-emerald-700 hover:bg-white" title="استرجاع" onClick={() => restItem.mutate({ id: it.id })}><RotateCcw className="h-4 w-4" /></button>
                  : <div className="flex">
                    <button disabled={idx === 0} className="rounded p-1 hover:bg-white disabled:opacity-30" title="أعلى" onClick={() => moveItem.mutate({ id: it.id, dir: "up" })}><ArrowUp className="h-4 w-4" /></button>
                    <button disabled={idx === activeItems.length - 1} className="rounded p-1 hover:bg-white disabled:opacity-30" title="أسفل" onClick={() => moveItem.mutate({ id: it.id, dir: "down" })}><ArrowDown className="h-4 w-4" /></button>
                    <button className="rounded p-1 hover:bg-white" title="تعديل" onClick={() => setItem({ id: it.id, curriculumId: c.id, title: it.title, description: it.description ?? "" })}><Pencil className="h-4 w-4" /></button>
                    <button className="rounded p-1 hover:bg-white" title="أرشفة" onClick={() => archItem.mutate({ id: it.id })}><Archive className="h-4 w-4" /></button>
                  </div>)}
              </li>;
            })}</ol>
            <div className="flex flex-wrap gap-2">
              {!archived && <Button size="sm" onClick={() => setItem({ curriculumId: c.id, title: "", description: "" })}><Plus className="h-3.5 w-3.5" />عنصر</Button>}
              {!archived && <Button size="sm" variant="ghost" onClick={() => setForm({ id: c.id, name: c.name, description: c.description ?? "" })}><Pencil className="h-3.5 w-3.5" />تعديل</Button>}
              <ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: c.id })} onRestore={() => rest.mutate({ id: c.id })} />
            </div>
          </Card>;
        })}</div>}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "تعديل المنهج" : "منهج جديد"}>
        {form && <div className="space-y-4">
          <Field label="اسم المنهج *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="الوصف"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Button className="w-full" loading={create.isPending || update.isPending} onClick={() => (form.id ? update.mutate({ id: form.id, name: form.name, description: form.description }) : create.mutate(form))}>حفظ</Button>
        </div>}
      </Dialog>
      <Dialog open={!!item} onOpenChange={(o) => !o && setItem(null)} title={item?.id ? "تعديل العنصر" : "عنصر جديد"}>
        {item && <div className="space-y-4">
          <Field label="العنوان *"><Input value={item.title} onChange={(e) => setItem({ ...item, title: e.target.value })} placeholder="مثال: جزء عمّ" /></Field>
          <Field label="الوصف"><Textarea value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} /></Field>
          <Button className="w-full" loading={addItem.isPending || updItem.isPending} onClick={() => (item.id ? updItem.mutate({ id: item.id, title: item.title, description: item.description }) : addItem.mutate({ curriculumId: item.curriculumId, title: item.title, description: item.description }))}>حفظ</Button>
        </div>}
      </Dialog>
    </>
  );
}
