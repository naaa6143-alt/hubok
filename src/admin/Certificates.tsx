import { useEffect, useMemo, useState } from "react";
import { Printer, Award, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn, fill, VARS } from "@/lib/utils";
import { Button, Card, Field, Select, Textarea } from "@/components/ui";
import { PageHeader, useAction, Empty, Loading } from "./shared";

type Tpl = "classic" | "modern" | "golden";
const NAMES: Record<Tpl, string> = { classic: "كلاسيكي", modern: "حديث", golden: "ذهبي" };

export function CertificateView({ tpl, title, text, center }: { tpl: Tpl; title: string; text: string; center: string }) {
  if (tpl === "modern") return (
    <div className="cert-print relative overflow-hidden rounded-2xl bg-white p-10 shadow-sm ring-1 ring-navy/10">
      <div className="absolute inset-y-0 right-0 w-3 bg-navy" /><div className="absolute inset-y-0 right-3 w-1 bg-gold" />
      <div className="flex items-center justify-between"><div className="font-amiri text-4xl font-bold text-navy">حُبُك</div><Award className="h-10 w-10 text-gold" /></div>
      <h2 className="mt-10 text-4xl font-extrabold tracking-tight text-navy">{title}</h2>
      <p className="mt-6 text-xl leading-loose text-navy/80">{text}</p>
      <div className="mt-12 flex justify-between border-t border-navy/10 pt-4 text-sm text-navy/60"><span>{center}</span><span>التوقيع: ................</span></div>
    </div>);
  if (tpl === "golden") return (
    <div className="cert-print rounded-2xl bg-gradient-to-br from-[#2a2110] via-navy-900 to-navy p-3 shadow-sm">
      <div className="rounded-xl border-2 border-gold-400 p-10 text-center text-white">
        <div className="font-amiri text-5xl font-bold text-gold-400">حُبُك</div>
        <h2 className="mt-6 font-amiri text-5xl font-bold text-white">{title}</h2>
        <div className="gold-line !w-48" />
        <p className="mx-auto mt-8 max-w-2xl font-amiri text-2xl leading-loose text-white/90">{text}</p>
        <div className="mt-10 text-sm text-gold-400">{center}</div>
      </div>
    </div>);
  return (
    <div className="cert-print rounded-2xl border-[3px] border-double border-gold bg-ivory p-3 shadow-sm">
      <div className="rounded-xl border border-gold/50 px-8 py-12 text-center">
        <div className="font-amiri text-4xl font-bold text-navy">حُبُك</div>
        <h2 className="mt-4 font-amiri text-5xl font-bold text-gold">{title}</h2>
        <div className="gold-line" />
        <p className="mx-auto mt-8 max-w-2xl font-amiri text-2xl leading-loose text-navy">{text}</p>
        <div className="mt-12 grid grid-cols-2 text-sm text-navy/60"><span>الختم</span><span>التوقيع</span></div>
      </div>
    </div>);
}

export default function Certificates() {
  const a = useAction();
  const { data } = trpc.certificates.roster.useQuery();
  const saveS = trpc.site.updateSettings.useMutation({ onSuccess: a.ok("حُفظ نص القالب"), onError: a.err });
  const [sid, setSid] = useState("");
  const [tpl, setTpl] = useState<Tpl>("classic");
  const [texts, setTexts] = useState<Record<Tpl, string>>({ classic: "", modern: "", golden: "" });
  useEffect(() => {
    if (!data) return;
    const s = data.settings;
    setTexts({ classic: s.cert_text_classic ?? "", modern: s.cert_text_modern ?? "", golden: s.cert_text_golden ?? "" });
    setTpl((s.cert_default_template as Tpl) || "classic");
    if (!sid && data.students[0]) setSid(String(data.students[0].applicantId));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const student = useMemo(() => data?.students.find((x) => String(x.applicantId) === sid), [data, sid]);
  if (!data) return <Loading />;
  if (!data.students.length) return <><PageHeader title="الشهادات" /><Empty icon={<Award className="h-8 w-8" />} text="لا يوجد طلاب مقيّدون في حلقات بعد" /></>;
  const vars = student?.vars ?? {};
  return (
    <>
      <PageHeader title="الشهادات" sub="ثلاثة قوالب بنصوص قابلة للتحرير تُملأ تلقائيًا ببيانات الطالب" actions={<Button onClick={() => window.print()}><Printer className="h-4 w-4" />طباعة</Button>} />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="no-print h-fit space-y-4">
          <Field label="الطالب"><Select value={sid} onChange={(e) => setSid(e.target.value)}>{data.students.map((s) => <option key={s.applicantId} value={s.applicantId}>{s.vars["الاسم"]} — {s.vars["الحلقة"]}</option>)}</Select></Field>
          <div><span className="field-label">القالب</span><div className="grid grid-cols-3 gap-2">{(Object.keys(NAMES) as Tpl[]).map((k) => <button key={k} onClick={() => setTpl(k)} className={cn("rounded-xl border py-2 text-sm font-bold", tpl === k ? "border-navy bg-navy text-white" : "border-navy/15 hover:bg-navy/5")}>{NAMES[k]}</button>)}</div></div>
          <Field label={`نص القالب (${NAMES[tpl]})`}><Textarea className="min-h-[160px]" value={texts[tpl]} onChange={(e) => setTexts({ ...texts, [tpl]: e.target.value })} /></Field>
          <div className="flex flex-wrap gap-1.5">{VARS.map((v) => <button key={v} onClick={() => setTexts({ ...texts, [tpl]: texts[tpl] + ` {${v}}` })} className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-[#8a6a14] hover:bg-gold/30">{`{${v}}`}</button>)}</div>
          <Button variant="outline" className="w-full" loading={saveS.isPending} onClick={() => saveS.mutate({ [`cert_text_${tpl}`]: texts[tpl] })}><Save className="h-4 w-4" />حفظ نص هذا القالب</Button>
        </Card>
        <CertificateView tpl={tpl} title={data.settings.cert_title ?? "شهادة تقدير"} text={fill(texts[tpl], vars)} center={vars["المركز"] ?? ""} />
      </div>
    </>
  );
}
