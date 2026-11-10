import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, UserPlus, CalendarRange, BookOpen, Shuffle, CalendarCheck, Mic, ListOrdered, BarChart3, Award, MessageCircle, Users, Settings as Cog, LogOut, Menu, ExternalLink, X } from "lucide-react";
import { trpc, tokenStore } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import Dashboard from "./Dashboard";
import Applicants from "./Applicants";
import Courses from "./Courses";
import Circles from "./Circles";
import Distribution from "./Distribution";
import Attendance from "./Attendance";
import Progress from "./Progress";
import Curricula from "./Curricula";
import Reports from "./Reports";
import Certificates from "./Certificates";
import WhatsApp from "./WhatsApp";
import Team from "./Team";
import Settings from "./Settings";

export const SECTIONS = [
  ["", "لوحة المتابعة", LayoutDashboard, Dashboard, "الرئيسية"], ["applicants", "المتقدمون", UserPlus, Applicants, "القبول والتسجيل"], ["distribution", "التوزيع", Shuffle, Distribution, "القبول والتسجيل"],
  ["courses", "الدورات", CalendarRange, Courses, "الدورات والحلقات"], ["circles", "الحلقات", BookOpen, Circles, "الدورات والحلقات"], ["curricula", "المناهج", ListOrdered, Curricula, "الدورات والحلقات"],
  ["attendance", "الحضور", CalendarCheck, Attendance, "المتابعة اليومية"], ["progress", "التسميع والتقدم", Mic, Progress, "المتابعة اليومية"],
  ["reports", "التقارير", BarChart3, Reports, "المخرجات والتواصل"], ["certificates", "الشهادات", Award, Certificates, "المخرجات والتواصل"], ["whatsapp", "واتساب", MessageCircle, WhatsApp, "المخرجات والتواصل"],
  ["team", "فريق العمل", Users, Team, "الإدارة"], ["settings", "الإعدادات", Cog, Settings, "الإدارة"],
] as const;
const GROUPS = [...new Set(SECTIONS.map((x) => x[4]))];
const todayLabel = () => new Intl.DateTimeFormat("ar-SA", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Riyadh" }).format(new Date());

export default function AdminApp() {
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const me = trpc.auth.me.useQuery(undefined, { enabled: !!tokenStore.get() });
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({ onSettled: async () => { tokenStore.clear(); await utils.invalidate(); nav("/login"); } });
  useEffect(() => setOpen(false), [loc.pathname]);
  const seg = loc.pathname.replace(/^\/admin\/?/, "").split("/")[0];
  const current = SECTIONS.find((x) => x[0] === seg) ?? SECTIONS[0];
  useEffect(() => { document.title = `${current[1]} — حُبُك`; return () => { document.title = "حُبُك — منصة الدورات القرآنية المكثفة"; }; }, [current]);

  if (!tokenStore.get()) return <Navigate to="/login" replace />;
  if (me.isLoading) return <div className="grid min-h-screen place-items-center"><img src="/favicon.svg" alt="حُبُك" className="h-14 w-14 animate-pulse rounded-2xl" /></div>;
  if (!me.data) { tokenStore.clear(); return <Navigate to="/login" replace />; }
  const CurIcon = current[2];

  return (
    <div className="min-h-screen bg-[#f6f4ee] lg:grid lg:grid-cols-[268px_1fr]">
      <aside className={cn("no-print fixed inset-y-0 right-0 z-50 flex w-[268px] flex-col overflow-hidden bg-navy text-white/80 shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none", open ? "translate-x-0" : "translate-x-full")}>
        <div className="pattern-light pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl ring-1 ring-white/10" />
            <span><span className="block font-amiri text-3xl font-bold leading-none text-white">حُبُك</span><span className="text-[11px] text-white/50">لوحة إدارة الدورات</span></span>
          </Link>
          <button className="rounded-lg p-1.5 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق القائمة"><X className="h-5 w-5" /></button>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 py-4">
          {GROUPS.map((g) => (
            <div key={g} className="mb-4">
              <div className="mb-1.5 px-3.5 text-[11px] font-bold tracking-wide text-white/35">{g}</div>
              <div className="space-y-0.5">
                {SECTIONS.filter((x) => x[4] === g).map(([path, label, Icon]) => (
                  <NavLink key={path} to={`/admin/${path}`} end={path === ""} className={({ isActive }) => cn("group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition hover:bg-white/[.06] hover:text-white", isActive && "bg-gradient-to-l from-gold to-[#c9a443] font-bold text-white shadow-lg shadow-black/20 hover:bg-gold")}>
                    <Icon className="h-[18px] w-[18px] opacity-90" />{label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="relative space-y-0.5 border-t border-white/10 p-3 text-sm">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:bg-white/[.06]"><ExternalLink className="h-[18px] w-[18px]" />الموقع العام</a>
          <button onClick={() => logout.mutate()} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-red-200/90 hover:bg-red-500/10"><LogOut className="h-[18px] w-[18px]" />تسجيل الخروج</button>
        </div>
      </aside>
      {open && <div className="no-print fixed inset-0 z-40 bg-navy-900/50 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-navy/10 bg-white/85 px-4 backdrop-blur-lg md:px-8">
          <button className="rounded-lg p-1.5 hover:bg-navy/5 lg:hidden" onClick={() => setOpen(true)} aria-label="القائمة"><Menu /></button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold sm:grid"><CurIcon className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0"><div className="truncate text-sm font-extrabold">{current[1]}</div><div className="truncate text-xs text-navy/45">{todayLabel()}</div></div>
          </div>
          <div className="flex items-center gap-2.5 rounded-full border border-navy/10 bg-white py-1 pe-3 ps-1 text-sm">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-400 font-bold text-white">{me.data.username[0]?.toUpperCase()}</span><b className="hidden sm:inline">{me.data.username}</b>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <Routes>
            {SECTIONS.map(([path, , , C]) => <Route key={path} path={path === "" ? "/" : path} element={<C />} />)}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
