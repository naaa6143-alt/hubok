# حُبُك — منصة إدارة الدورات القرآنية المكثفة

واجهة عربية RTL كاملة + لوحة إدارة بـ13 قسمًا + قاعدة بيانات PostgreSQL على **Supabase** + نشر على **Vercel**.
**لا يوجد حذف نهائي في النظام**: كل «حذف» أرشفة عبر `archived_at` مع تبويب «الأرشيف» والاسترجاع بضغطة.

## التقنيات
- الواجهة: React 19 + Vite + Tailwind CSS + مكونات بأسلوب shadcn/ui (Radix) + Recharts
- الخادم: Hono + tRPC 11 + Drizzle ORM + PostgreSQL (Supabase)
- الاستضافة: Vercel — الواجهة ملفات ثابتة، والـAPI دالة Serverless واحدة (`api/trpc.ts`) في منطقة فرانكفورت `fra1` بجوار قاعدة البيانات
- الدخول: اسم مستخدم + كلمة مرور مشفّرة بـ scrypt، وجلسات في جدول `admin_sessions` برمز Bearer (يُحفظ في القاعدة مُجزّأً SHA-256)

## قاعدة البيانات (Supabase)
- المشروع: `hubuk` (المعرّف `ybtpusnnstouhpzoffrj`، المنطقة eu-central-1).
- الهجرات في مجلد `drizzle/` وقد طُبّقت على المشروع:
  - `0000_init.sql`: 12 جدولًا + 4 أنواع ENUM + مفاتيح أجنبية + فهارس.
  - `0001_rls.sql`: تفعيل RLS على كل الجداول بلا سياسات، فلا يمكن قراءة أي بيانات عبر واجهة Supabase العامة (anon key). التطبيق يتصل مباشرة بدور `postgres` من الخادم فقط.
- لأي تعديل لاحق على `server/schema.ts`: `npm run db:generate` ثم `npm run db:migrate`.

## التشغيل محليًا
```bash
npm install
cp .env.example .env          # ضع DATABASE_URL (Postgres محلي أو Supabase)
npm run db:migrate            # إنشاء الجداول (آمن: لا يمسح البيانات)
npm run dev                   # الواجهة http://localhost:5173 والخادم :3000
```
عند أول طلب يُنشأ المدير الافتراضي (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) ودورة افتراضية.
**غيّر كلمة المرور فورًا** من: الإعدادات ← كلمة المرور.

## النشر على Vercel
1. في Supabase: **Project → Connect → Transaction pooler** وانسخ الرابط (المنفذ `6543`) مع كلمة مرور القاعدة.
2. في Vercel: **Add New → Project** واختر هذا المستودع من GitHub (الإعدادات تُقرأ تلقائيًا من `vercel.json`).
3. أضف متغيرات البيئة (Production + Preview):
   | المتغير | القيمة |
   |---|---|
   | `DATABASE_URL` | رابط Transaction pooler من الخطوة 1 |
   | `ADMIN_USERNAME` | اسم المدير الأول |
   | `ADMIN_PASSWORD` | كلمة مرور قوية للمدير الأول |
4. اضغط **Deploy**. تحقق من `https://<domain>/api/health` → `{"ok":true}`.
5. ادخل من `/login` وغيّر كلمة المرور من الإعدادات.

كل دفع (push) إلى الفرع الرئيسي يُنشر تلقائيًا، وكل فرع آخر يحصل على رابط معاينة.

## التشغيل على خادم Node عادي (بديل)
```bash
npm ci && npm run build && npm run db:migrate
npm start                     # يخدم الواجهة المبنية و /trpc على المنفذ PORT
```

## الاختبار
```bash
npm run test:e2e   # يتطلب تشغيل الخادم — يختبر: تسجيل ← قبول ← توزيع ← حضور ← تسميع ← شهادة + الأرشفة والاستيراد
```
⚠️ الاختبار يُضيف بيانات تجريبية حقيقية؛ شغّله على قاعدة اختبار لا على الإنتاج.

## الجداول
`applicants` (مع `guardian_phone`)، `team_members`، `admins`، `admin_sessions`، `site_settings`، `courses`، `circles` (مع `course_id` و`curriculum_id`)، `enrollments`، `attendance_records` (فريد لكل طالب/حلقة/تاريخ)، `progress_records`، `curricula`، `curriculum_items`.
كل جداول المحتوى فيها `archived_at`. الاستثناء الوحيد: حذف جلسة دخول عند الخروج (رمز وصول وليس بيانات).

## استيراد CSV للمتقدمين
نزّل القالب من صفحة «المتقدمون». الأعمدة: `الاسم,الجوال,جوال_ولي_الأمر,النوع,الجنس,العمر,المدينة,البرنامج,البريد,ملاحظات`.
يتجاوز الاستيراد أي رقم جوال مسجّل مسبقًا لنفس النوع (طالب/معلم).

## المتغيرات في الشهادات والواتساب
`{الاسم} {الحلقة} {الدورة} {المركز} {التاريخ} {نسبة_الحضور} {عدد_التسميعات} {التقدير}`
التقدير يُحسب من متوسط درجات التسميع، وإن لم توجد فمن نسبة الحضور.
