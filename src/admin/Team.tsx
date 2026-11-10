import { useState } from "react";
import { Plus, Pencil, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button, Card, Dialog, Field, Input, Textarea } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction, Empty } from "./shared";

type F = { id?: number; name: string; role: string; phone: string; bio: string };
export default function Team() {
  const a = useAction();
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState<F | null>(null);
  const { data = [] } = trpc.team.list.useQuery({ archived });
  const done = () => { setForm(null); a.ok("تم الحفظ")(); };
  const create = trpc.team.create.useMutation({ onSuccess: done, onError: a.err });
  const update = trpc.team.update.useMutation({ onSuccess: done, onError: a.err });
  const arch = trpc.team.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.team.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  return (
    <>
      <PageHeader title="فريق العمل" sub="يظهر الأعضاء النشطون في الصفحة الرئيسية" actions={<Button onClick={() => setForm({ name: "", role: "", phone: "", bio: "" })}><Plus className="h-4 w-4" />عضو جديد</Button>} />
      <div className="mb-4"><ArchiveSwitch value={archived} onChange={setArchived} /></div>
      {data.length === 0 ? <Empty icon={<Users className="h-8 w-8" />} text={archived ? "الأرشيف فارغ" : "لا يوجد أعضاء"} /> :
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.map((m) => (
          <Card key={m.id} className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-navy font-amiri text-2xl text-gold-400">{m.name.trim()[0]}</div>
            <h3 className="font-extrabold">{m.name}</h3>{m.role && <p className="text-sm text-gold">{m.role}</p>}
            {m.phone && <p dir="ltr" className="mt-1 text-xs text-navy/50">{m.phone}</p>}{m.bio && <p className="mt-2 text-sm text-navy/60">{m.bio}</p>}
            <div className="mt-4 flex justify-center gap-2">
              {!archived && <Button size="sm" variant="ghost" onClick={() => setForm({ id: m.id, name: m.name, role: m.role ?? "", phone: m.phone ?? "", bio: m.bio ?? "" })}><Pencil className="h-3.5 w-3.5" />تعديل</Button>}
              <ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: m.id })} onRestore={() => rest.mutate({ id: m.id })} />
            </div>
          </Card>))}</div>}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "تعديل العضو" : "عضو جديد"}>
        {form && <div className="space-y-4">
          <Field label="الاسم *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="المسمى"><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="مثال: مشرف الحلقات" /></Field>
          <Field label="الجوال"><Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="نبذة"><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          <Button className="w-full" loading={create.isPending || update.isPending} onClick={() => (form.id ? update.mutate({ ...form, id: form.id }) : create.mutate(form))}>حفظ</Button>
        </div>}
      </Dialog>
    </>
  );
}
