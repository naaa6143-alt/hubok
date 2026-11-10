import { useEffect, useState } from "react";
import { Save, KeyRound, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button, Card, CardTitle, Field, Input, Select, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { PageHeader, useAction, Loading } from "./shared";

type Item = { title: string; text: string };
const parse = (s?: string): Item[] => { try { return JSON.parse(s ?? "[]"); } catch { return []; } };

function ItemsEditor({ items, onChange }: { items: Item[]; onChange: (v: Item[]) => void }) {
  return <div className="space-y-3">
    {items.map((it, i) => <div key={i} className="flex gap-2 rounded-xl bg-ivory p-3">
      <div className="flex-1 space-y-2"><Input value={it.title} placeholder="العنوان" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
        <Input value={it.text} placeholder="الوصف" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} /></div>
      <button className="self-start rounded-lg p-2 text-navy/40 hover:bg-white hover:text-red-600" title="إزالة من القائمة" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
    </div>)}
    <Button size="sm" variant="outline" onClick={() => onChange([...items, { title: "", text: "" }])}><Plus className="h-3.5 w-3.5" />إضافة بند</Button>
  </div>;
}

export default function Settings() {
  const a = useAction();
  const { data } = trpc.site.settings.useQuery();
  const [s, setS] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  useEffect(() => { if (data) setS(data); }, [data]);
  const save = trpc.site.updateSettings.useMutation({ onSuccess: a.ok("تم حفظ الإعدادات"), onError: a.err });
  const change = trpc.auth.changePassword.useMutation({ onSuccess: () => { setPw({ current: "", next: "", confirm: "" }); a.ok("تم تغيير كلمة المرور")(); }, onError: a.err });
  if (!data) return <Loading />;
  const f = (k: string, label: string, area = false, hint?: string) => <Field label={label} hint={hint}>{area ? <Textarea value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /> : <Input value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} />}</Field>;
  const saveKeys = (keys: string[]) => save.mutate(Object.fromEntries(keys.map((k) => [k, s[k] ?? ""])));
  const SaveBtn = ({ keys }: { keys: string[] }) => <Button className="mt-5" loading={save.isPending} onClick={() => saveKeys(keys)}><Save className="h-4 w-4" />حفظ</Button>;
  return (
    <>
      <PageHeader title="الإعدادات" sub="نصوص الموقع والإحصاءات والشهادات وكلمة المرور" />
      <Tabs defaultValue="site" dir="rtl">
        <TabsList className="mb-5 flex-wrap"><TabsTrigger value="site">نصوص الموقع</TabsTrigger><TabsTrigger value="stats">الإحصاءات</TabsTrigger><TabsTrigger value="how">كيف يعمل</TabsTrigger><TabsTrigger value="lists">البرامج والمميزات</TabsTrigger><TabsTrigger value="cert">الشهادات</TabsTrigger><TabsTrigger value="pw">كلمة المرور</TabsTrigger></TabsList>
        <TabsContent value="site"><Card><div className="grid gap-4 md:grid-cols-2">
          {f("site_name", "اسم الموقع")}{f("center_name", "اسم المركز (يُستخدم في الشهادات)")}{f("since", "منذ")}{f("hero_tagline", "الشعار")}
          <div className="md:col-span-2">{f("about_text", "نص «عن حبك»", true)}</div>{f("cta_title", "عنوان دعوة التسجيل")}{f("cta_text", "نص دعوة التسجيل")}{f("team_empty_text", "نص فريق العمل عند عدم وجود أعضاء")}
        </div><SaveBtn keys={["site_name", "center_name", "since", "hero_tagline", "about_text", "cta_title", "cta_text", "team_empty_text"]} /></Card></TabsContent>
        <TabsContent value="stats"><Card><p className="mb-4 text-sm text-navy/60">اترك الحقل فارغًا ليُحسب تلقائيًا من قاعدة البيانات، أو اكتب رقمًا ليُعرض بدلًا منه.</p><div className="grid gap-4 md:grid-cols-4">
          {f("stat_students", "عدد الطلاب")}{f("stat_teachers", "عدد المعلمين")}{f("stat_circles", "عدد الحلقات")}{f("stat_pages", "الأوجه المسمّعة")}
        </div><SaveBtn keys={["stat_students", "stat_teachers", "stat_circles", "stat_pages"]} /></Card></TabsContent>
        <TabsContent value="how"><Card className="space-y-4">{f("how_title", "عنوان القسم")}
          {[1, 2, 3].map((n) => <div key={n} className="grid gap-3 rounded-xl bg-ivory p-4 md:grid-cols-2">{f(`how_${n}_title`, `الخطوة ${n} — العنوان`)}{f(`how_${n}_text`, `الخطوة ${n} — النص`)}</div>)}
          <SaveBtn keys={["how_title", "how_1_title", "how_1_text", "how_2_title", "how_2_text", "how_3_title", "how_3_text"]} /></Card></TabsContent>
        <TabsContent value="lists"><div className="grid gap-5 lg:grid-cols-2">
          <Card><CardTitle>البرامج</CardTitle><ItemsEditor items={parse(s.programs)} onChange={(v) => setS({ ...s, programs: JSON.stringify(v) })} /><SaveBtn keys={["programs"]} /></Card>
          <Card><CardTitle>منظومة متكاملة (المميزات)</CardTitle><ItemsEditor items={parse(s.features)} onChange={(v) => setS({ ...s, features: JSON.stringify(v) })} /><SaveBtn keys={["features"]} /></Card>
        </div></TabsContent>
        <TabsContent value="cert"><Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">{f("cert_title", "عنوان الشهادة")}
            <Field label="القالب الافتراضي"><Select value={s.cert_default_template ?? "classic"} onChange={(e) => setS({ ...s, cert_default_template: e.target.value })}><option value="classic">كلاسيكي</option><option value="modern">حديث</option><option value="golden">ذهبي</option></Select></Field></div>
          {f("cert_text_classic", "النص الافتراضي — كلاسيكي", true)}{f("cert_text_modern", "النص الافتراضي — حديث", true)}{f("cert_text_golden", "النص الافتراضي — ذهبي", true)}
          {f("wa_template", "قالب رسالة واتساب", true, "المتغيرات: {الاسم} {الحلقة} {الدورة} {المركز} {التاريخ} {نسبة_الحضور} {عدد_التسميعات} {التقدير}")}
          <SaveBtn keys={["cert_title", "cert_default_template", "cert_text_classic", "cert_text_modern", "cert_text_golden", "wa_template"]} /></Card></TabsContent>
        <TabsContent value="pw"><Card className="max-w-md space-y-4">
          <CardTitle><KeyRound className="h-5 w-5 text-gold" />تغيير كلمة مرور المدير</CardTitle>
          <Field label="كلمة المرور الحالية"><Input type="password" dir="ltr" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="الجديدة (٨ أحرف على الأقل)"><Input type="password" dir="ltr" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="تأكيد الجديدة"><Input type="password" dir="ltr" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></Field>
          <Button loading={change.isPending} onClick={() => (pw.next !== pw.confirm ? a.toast("التأكيد لا يطابق", "err") : change.mutate({ current: pw.current, next: pw.next }))}>تغيير كلمة المرور</Button>
          <p className="text-xs text-navy/50">ستُنهى جميع الجلسات الأخرى بعد التغيير.</p>
        </Card></TabsContent>
      </Tabs>
    </>
  );
}
