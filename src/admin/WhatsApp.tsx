import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Save, ExternalLink, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ar, fill, VARS, waNumber } from "@/lib/utils";
import { Badge, Button, Card, CardTitle, Field, Select, Table, Textarea } from "@/components/ui";
import { PageHeader, useAction, Loading } from "./shared";

export default function WhatsApp() {
  const a = useAction();
  const { data } = trpc.certificates.roster.useQuery();
  const saveS = trpc.site.updateSettings.useMutation({ onSuccess: a.ok("حُفظ القالب"), onError: a.err });
  const [msg, setMsg] = useState("");
  const [toGuardian, setTG] = useState(true);
  const [circle, setCircle] = useState("");
  useEffect(() => { if (data) setMsg(data.settings.wa_template ?? ""); }, [data]);
  const circles = useMemo(() => [...new Set(data?.students.map((s) => s.vars["الحلقة"]) ?? [])], [data]);
  if (!data) return <Loading />;
  const list = data.students.filter((s) => !circle || s.vars["الحلقة"] === circle);
  const target = (s: (typeof list)[number]) => (toGuardian ? waNumber(s.guardianPhone) ?? null : waNumber(s.phone));
  const ready = list.filter((s) => target(s)).length;
  return (
    <>
      <PageHeader title="واتساب" sub="محرر رسالة بمتغيرات وروابط wa.me جاهزة لكل طالب" />
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <Card className="h-fit space-y-4">
          <CardTitle><MessageCircle className="h-5 w-5 text-emerald-600" />نص الرسالة</CardTitle>
          <Textarea className="min-h-[170px]" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">{VARS.map((v) => <button key={v} onClick={() => setMsg(msg + ` {${v}}`)} className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-[#8a6a14] hover:bg-gold/30">{`{${v}}`}</button>)}</div>
          <label className="flex items-center gap-2 rounded-xl bg-ivory p-3 text-sm font-bold"><input type="checkbox" checked={toGuardian} onChange={(e) => setTG(e.target.checked)} />الإرسال إلى ولي الأمر بدل الطالب</label>
          <Field label="تصفية بالحلقة"><Select value={circle} onChange={(e) => setCircle(e.target.value)}><option value="">كل الحلقات</option>{circles.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Button variant="outline" className="w-full" loading={saveS.isPending} onClick={() => saveS.mutate({ wa_template: msg })}><Save className="h-4 w-4" />حفظ كقالب افتراضي</Button>
        </Card>
        <div>
          <p className="mb-3 text-sm text-navy/60">{ar(ready)} من {ar(list.length)} جاهزة للإرسال{toGuardian ? " (الطلاب بلا جوال ولي أمر لا تظهر لهم روابط)" : ""}</p>
          <Table head={["الطالب", "الرقم", "معاينة الرسالة", ""]} empty={list.length === 0}>
            {list.map((s) => {
              const n = target(s); const text = fill(msg, s.vars);
              const url = n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
              return <tr key={s.applicantId}>
                <td className="font-bold">{s.vars["الاسم"]}<div className="text-xs font-normal text-navy/50">{s.vars["الحلقة"]}</div></td>
                <td dir="ltr" className="text-right text-xs">{n ? `+${n}` : <Badge tone="red">لا يوجد رقم</Badge>}</td>
                <td className="max-w-[340px] text-xs leading-relaxed text-navy/70">{text}</td>
                <td><div className="flex gap-1.5">
                  {url ? <Button asChild size="sm" variant="success"><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />فتح</a></Button> : null}
                  <Button size="sm" variant="ghost" aria-label="نسخ" onClick={() => navigator.clipboard.writeText(text).then(() => a.toast("نُسخ النص"), () => a.toast("تعذّر النسخ", "err"))}><Copy className="h-3.5 w-3.5" /></Button>
                </div></td>
              </tr>;
            })}
          </Table>
        </div>
      </div>
    </>
  );
}
