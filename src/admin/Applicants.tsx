import { useRef, useState } from "react";
import { Check, X, Upload, Download, Plus, Pencil, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, downloadText, parseCsv } from "@/lib/utils";
import { Badge, Button, Dialog, Field, Input, Select, Table, Textarea } from "@/components/ui";
import { PageHeader, ArchiveSwitch, ArchiveButton, useAction } from "./shared";
import { PhoneInput } from "@/pages/Register";

type Status = "new" | "accepted" | "rejected";
const ST: Record<Status, [string, "gold" | "green" | "red"]> = { new: ["جديد", "gold"], accepted: ["مقبول", "green"], rejected: ["مرفوض", "red"] };
const TEMPLATE = "الاسم,الجوال,جوال_ولي_الأمر,النوع,الجنس,العمر,المدينة,البرنامج,البريد,ملاحظات\nعبدالله محمد الحربي,0501234567,0559876543,طالب,ذكر,14,الرياض,برنامج الحفظ,,\n";
type Form = { id?: number; kind: "student" | "teacher"; fullName: string; phone: string; guardianPhone: string; email: string; gender: string; age: string; city: string; program: string; notes: string };
const blank: Form = { kind: "student", fullName: "", phone: "", guardianPhone: "", email: "", gender: "", age: "", city: "", program: "", notes: "" };

export default function Applicants() {
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState<Status | "">("");
  const [kind, setKind] = useState<"student" | "teacher" | "">("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const a = useAction();
  const list = trpc.applicants.list.useQuery({ archived, status: status || undefined, kind: kind || undefined, q: q || undefined });
  const setSt = trpc.applicants.setStatus.useMutation({ onSuccess: a.ok("تم تحديث الحالة"), onError: a.err });
  const arch = trpc.applicants.archive.useMutation({ onSuccess: a.ok("تمت الأرشفة"), onError: a.err });
  const rest = trpc.applicants.restore.useMutation({ onSuccess: a.ok("تم الاسترجاع"), onError: a.err });
  const imp = trpc.applicants.importCsv.useMutation({ onSuccess: (r) => { a.ok(`تم الاستيراد: ${ar(r.inserted)} جديد، ${ar(r.skipped)} مكرر، ${ar(r.invalid)} غير صالح`)(); }, onError: a.err });
  const create = trpc.applicants.create.useMutation({ onSuccess: () => { setForm(null); a.ok("تمت الإضافة")(); }, onError: a.err });
  const update = trpc.applicants.update.useMutation({ onSuccess: () => { setForm(null); a.ok("تم الحفظ")(); }, onError: a.err });

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const rows = parseCsv(await f.text());
    if (!rows.length) return a.toast("الملف فارغ أو غير صالح", "err");
    imp.mutate({ rows });
  };
  const save = () => {
    if (!form) return;
    const v = { kind: form.kind, fullName: form.fullName, phone: form.phone, guardianPhone: form.guardianPhone, email: form.email, gender: (form.gender || null) as "male" | "female" | null, age: form.age ? Number(form.age) : null, city: form.city, program: form.program, notes: form.notes };
    if (form.id) update.mutate({ ...v, id: form.id }); else create.mutate(v);
  };
  const up = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => f && { ...f, [k]: e.target.value });
  const rows = list.data ?? [];

  return (
    <>
      <PageHeader title="المتقدمون" sub={`${ar(rows.length)} سجل`} actions={<>
        <Button variant="outline" onClick={() => downloadText("قالب_المتقدمين.csv", TEMPLATE)}><Download className="h-4 w-4" />قالب CSV</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()} loading={imp.isPending}><Upload className="h-4 w-4" />استيراد CSV</Button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={onFile} />
        <Button onClick={() => setForm(blank)}><Plus className="h-4 w-4" />إضافة</Button>
      </>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ArchiveSwitch value={archived} onChange={setArchived} />
        <div className="relative min-w-[220px] flex-1"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pr-9" placeholder="ابحث بالاسم أو الجوال…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value as Status | "")}><option value="">كل الحالات</option><option value="new">جديد</option><option value="accepted">مقبول</option><option value="rejected">مرفوض</option></Select>
        <Select className="w-32" value={kind} onChange={(e) => setKind(e.target.value as "student" | "teacher" | "")}><option value="">الكل</option><option value="student">طلاب</option><option value="teacher">معلمون</option></Select>
      </div>
      <Table head={["الاسم", "النوع", "الجوال", "جوال ولي الأمر", "البرنامج", "التاريخ", "الحالة", "إجراءات"]} empty={!list.isLoading && rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="min-w-[170px] font-bold">{r.fullName}{r.city && <div className="text-xs font-normal text-navy/50">{r.city}{r.age ? ` · ${ar(r.age)} سنة` : ""}</div>}</td>
            <td>{r.kind === "student" ? "طالب" : "معلم"}</td>
            <td dir="ltr" className="text-right">0{r.phone}</td>
            <td dir="ltr" className="text-right">{r.guardianPhone ? `0${r.guardianPhone}` : "—"}</td>
            <td className="text-xs">{r.program ?? "—"}</td>
            <td className="text-xs text-navy/50">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
            <td><Badge tone={ST[r.status][1]}>{ST[r.status][0]}</Badge></td>
            <td><div className="flex flex-wrap gap-1.5">
              {!archived && r.status !== "accepted" && <Button size="sm" variant="success" onClick={() => setSt.mutate({ id: r.id, status: "accepted" })}><Check className="h-3.5 w-3.5" />قبول</Button>}
              {!archived && r.status !== "rejected" && <Button size="sm" variant="outline" className="text-red-600" onClick={() => setSt.mutate({ id: r.id, status: "rejected" })}><X className="h-3.5 w-3.5" />رفض</Button>}
              {!archived && <Button size="sm" variant="ghost" onClick={() => setForm({ id: r.id, kind: r.kind, fullName: r.fullName, phone: r.phone, guardianPhone: r.guardianPhone ?? "", email: r.email ?? "", gender: r.gender ?? "", age: r.age ? String(r.age) : "", city: r.city ?? "", program: r.program ?? "", notes: r.notes ?? "" })} aria-label="تعديل"><Pencil className="h-3.5 w-3.5" /></Button>}
              <ArchiveButton archived={archived} onArchive={() => arch.mutate({ id: r.id })} onRestore={() => rest.mutate({ id: r.id })} />
            </div></td>
          </tr>
        ))}
      </Table>
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)} title={form?.id ? "تعديل متقدم" : "إضافة متقدم (يُضاف مقبولًا)"}>
        {form && <div className="space-y-4">
          <Field label="النوع"><Select value={form.kind} onChange={up("kind")}><option value="student">طالب</option><option value="teacher">معلم</option></Select></Field>
          <Field label="الاسم الكامل *"><Input value={form.fullName} onChange={up("fullName")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الجوال *"><PhoneInput value={form.phone} onChange={up("phone")} /></Field>
            {form.kind === "student" && <Field label="جوال ولي الأمر"><PhoneInput value={form.guardianPhone} onChange={up("guardianPhone")} /></Field>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="الجنس"><Select value={form.gender} onChange={up("gender")}><option value="">—</option><option value="male">ذكر</option><option value="female">أنثى</option></Select></Field>
            <Field label="العمر"><Input type="number" value={form.age} onChange={up("age")} /></Field>
            <Field label="المدينة"><Input value={form.city} onChange={up("city")} /></Field>
          </div>
          <Field label="البرنامج"><Input value={form.program} onChange={up("program")} /></Field>
          <Field label="البريد"><Input dir="ltr" value={form.email} onChange={up("email")} /></Field>
          <Field label="ملاحظات"><Textarea value={form.notes} onChange={up("notes")} /></Field>
          <Button className="w-full" onClick={save} loading={create.isPending || update.isPending}>حفظ</Button>
        </div>}
      </Dialog>
    </>
  );
}
