/** اختبار المسار الكامل عبر الـ API: npm run test:e2e (الخادم يعمل على PORT) */
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../server/routers";

const base = `http://localhost:${process.env.PORT || 3000}/trpc`;
let token = "";
const api = createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: base, transformer: superjson, headers: () => (token ? { Authorization: `Bearer ${token}` } : {}) })] });
const ok = (c: unknown, m: string) => { if (!c) { console.error("✗", m); process.exit(1); } console.log("✓", m); };
const fails = async (p: Promise<unknown>, m: string) => { try { await p; ok(false, m); } catch { ok(true, m); } };
const stamp = String(Date.now()).slice(-7);

// 1) تسجيل عام (بدون دخول)
await api.applicants.register.mutate({ kind: "student", fullName: "طالب الاختبار " + stamp, phone: "05" + stamp + "1", guardianPhone: "+9665" + stamp + "2" });
await api.applicants.register.mutate({ kind: "teacher", fullName: "معلم الاختبار " + stamp, phone: "05" + stamp + "3" });
ok((await api.applicants.register.mutate({ kind: "student", fullName: "مكرر", phone: "9665" + stamp + "1" })).ok === false, "رفض التسجيل المكرر برقم الجوال");
await fails(api.applicants.list.query({ archived: false }), "حماية لوحة الإدارة بدون رمز دخول");
// 2) دخول المدير
token = (await api.auth.login.mutate({ username: process.env.ADMIN_USERNAME || "admin", password: process.env.ADMIN_PASSWORD || "admin123" })).token;
ok(token.length === 64, "دخول المدير وإصدار رمز Bearer");
const apps = await api.applicants.list.query({ archived: false, q: stamp });
const st = apps.find((a) => a.kind === "student")!, te = apps.find((a) => a.kind === "teacher")!;
ok(st && st.status === "new" && st.guardianPhone === "5" + stamp + "2", "ظهور الطالب للإدارة مع جوال ولي الأمر مطبّعًا");
// شرط القبول قبل التوزيع
const [course] = (await api.courses.list.query({ archived: false })).filter((c) => c.isDefault);
ok(course, "وجود دورة افتراضية");
await api.circles.create.mutate({ name: "حلقة اختبار " + stamp, capacity: 1, teacherId: null });
const circle = (await api.circles.list.query({ archived: false })).find((c) => c.name.endsWith(stamp))!;
ok(circle.courseId === course.id, "ربط الحلقة بالدورة الافتراضية تلقائيًا");
await fails(api.distribution.assign.mutate({ applicantId: st.id, circleId: circle.id }), "منع توزيع طالب غير مقبول");
// 3) القبول
await api.applicants.setStatus.mutate({ id: st.id, status: "accepted" });
await api.applicants.setStatus.mutate({ id: te.id, status: "accepted" });
await api.circles.update.mutate({ id: circle.id, name: circle.name, capacity: 1, teacherId: te.id, courseId: course.id });
// 4) التوزيع + الطاقة
await api.distribution.assign.mutate({ applicantId: st.id, circleId: circle.id });
const d = await api.distribution.state.query();
ok(d.enrollments.some((e) => e.applicantId === st.id && e.circleId === circle.id), "توزيع الطالب على الحلقة");
await api.applicants.create.mutate({ kind: "student", fullName: "طالب ثانٍ " + stamp, phone: "05" + stamp + "4" });
const st2 = (await api.applicants.list.query({ archived: false, q: "طالب ثانٍ " + stamp }))[0];
await fails(api.distribution.assign.mutate({ applicantId: st2.id, circleId: circle.id }), "منع التوزيع عند امتلاء الحلقة");
// 5) الحضور (سجل فريد) والتسميع
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date());
await api.attendance.save.mutate({ circleId: circle.id, date: today, records: [{ applicantId: st.id, status: "absent" }] });
await api.attendance.save.mutate({ circleId: circle.id, date: today, records: [{ applicantId: st.id, status: "present" }] });
const att = await api.attendance.get.query({ circleId: circle.id, date: today });
ok(att.length === 1 && att[0].status === "present", "رصد الحضور وتحديث السجل الفريد بدل التكرار");
await fails(api.progress.add.mutate({ applicantId: st2.id, circleId: circle.id, date: today, portion: "الفاتحة", pages: 1 }), "منع التسميع لطالب غير مقيّد");
await api.progress.add.mutate({ applicantId: st.id, circleId: circle.id, date: today, portion: "سورة الملك", pages: 3, grade: 95 });
// 6) الشهادة المعبأة
const roster = await api.certificates.roster.query();
const v = roster.students.find((x) => x.applicantId === st.id)!.vars;
ok(v["الاسم"] === st.fullName && v["الدورة"] === course.name && v["الحلقة"] === circle.name, "شهادة معبأة باسم الطالب ودورته وحلقته");
ok(v["نسبة_الحضور"] === "100%" && v["عدد_التسميعات"] === "1" && v["التقدير"] === "ممتاز", "متغيرات الحضور والتسميع والتقدير");
// 7) الأرشفة والاسترجاع والنقل
await api.circles.create.mutate({ name: "حلقة ثانية " + stamp, capacity: 5 });
const c2 = (await api.circles.list.query({ archived: false })).find((c) => c.name === "حلقة ثانية " + stamp)!;
const en = (await api.distribution.state.query()).enrollments.find((e) => e.applicantId === st.id)!;
await api.distribution.move.mutate({ enrollmentId: en.id, toCircleId: c2.id });
const after = await api.distribution.state.query();
ok(after.enrollments.find((e) => e.applicantId === st.id)?.circleId === c2.id && !after.enrollments.some((e) => e.id === en.id), "نقل الطالب مع أرشفة القيد القديم");
await api.applicants.archive.mutate({ id: st2.id });
ok((await api.applicants.list.query({ archived: true, q: stamp })).some((a) => a.id === st2.id), "الأرشفة تنقل السجل لتبويب الأرشيف");
await api.applicants.restore.mutate({ id: st2.id });
ok((await api.applicants.list.query({ archived: false, q: stamp })).some((a) => a.id === st2.id), "الاسترجاع بضغطة واحدة");
const imp = await api.applicants.importCsv.mutate({ rows: [{ "الاسم": "مستورد " + stamp, "الجوال": "05" + stamp + "5" }, { "الاسم": "مكرر", "الجوال": "05" + stamp + "1" }] });
ok(imp.inserted === 1 && imp.skipped === 1, "استيراد CSV مع تجاوز المكرر برقم الجوال");
const rep = await api.reports.overview.query();
ok(rep.series.length === 30 && rep.top.length > 0, "التقارير: سلسلة ٣٠ يومًا وقائمة الأوائل");
const dash = await api.dashboard.get.query();
ok(dash.alerts.length === 4, "تنبيهات لوحة المتابعة");
console.log("\nنجح المسار الكامل ✔");
