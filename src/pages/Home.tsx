import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, LogIn, Menu, X, HeartHandshake, BookOpen, Users, Layers, Sparkles, CheckCircle2, UserRound, ClipboardList, BarChart3, Award, MessageCircle, CalendarCheck, ArrowLeft, ShieldCheck, Clock3, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Reveal, Counter } from "@/components/Reveal";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Item = { title: string; text: string };
const parse = (s?: string): Item[] => { try { const v = JSON.parse(s ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const NAV = [["#about", "عن حُبُك"], ["#programs", "البرامج"], ["#features", "المنظومة"], ["#how", "كيف يعمل"], ["#team", "فريق العمل"]];
const FEAT_ICONS = [ClipboardList, CalendarCheck, BookOpen, Award, MessageCircle, BarChart3];
const PROG_ICONS = [BookOpen, Sparkles, Target];

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-xl shadow-sm" />
      <span className={cn("font-amiri text-3xl font-bold leading-none", light ? "text-white" : "text-navy")}>حُبُك</span>
    </span>
  );
}

export function SiteHeader({ minimal }: { minimal?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={cn("no-print sticky top-0 z-40 border-b bg-ivory/80 backdrop-blur-lg transition-shadow", scrolled ? "border-navy/10 shadow-[0_4px_24px_-12px_rgba(19,41,61,.25)]" : "border-transparent")}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="حُبُك — الرئيسية"><Logo /></Link>
        {!minimal && <nav className="hidden items-center gap-1 text-sm font-medium text-navy/70 lg:flex">{NAV.map(([h, l]) => <a key={h} href={h} className="rounded-lg px-3 py-2 transition hover:bg-navy/5 hover:text-navy">{l}</a>)}</nav>}
        <div className="flex items-center gap-2">
          {minimal ? <Button asChild variant="ghost" size="sm"><Link to="/">الرئيسية<ArrowLeft className="h-4 w-4" /></Link></Button> : <>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/login"><LogIn className="h-4 w-4" />دخول الإدارة</Link></Button>
            <Button asChild size="sm"><Link to="/register">سجّل الآن</Link></Button>
            <button className="rounded-lg p-2 hover:bg-navy/5 lg:hidden" onClick={() => setOpen(!open)} aria-label="القائمة" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
          </>}
        </div>
      </div>
      {open && !minimal && <nav className="flex flex-col gap-1 border-t border-navy/10 bg-ivory px-4 py-3 lg:hidden">
        {NAV.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-navy/5">{l}</a>)}
        <Link to="/login" className="rounded-lg px-3 py-2.5 font-medium hover:bg-navy/5">دخول الإدارة</Link>
      </nav>}
    </header>
  );
}

function Section({ id, title, kicker, icon, children, tone = "ivory" }: { id: string; title: string; kicker?: string; icon?: React.ReactNode; children: React.ReactNode; tone?: "ivory" | "white" }) {
  return (
    <section id={id} className={cn("scroll-mt-16 py-20 md:py-24", tone === "white" && "bg-white")}>
      <div className="mx-auto max-w-6xl px-4">
        <Reveal className="mb-12 text-center">
          {icon && <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-100 text-gold">{icon}</div>}
          {kicker && <p className="mb-2 text-sm font-bold text-gold">{kicker}</p>}
          <h2 className="font-amiri text-4xl font-bold md:text-5xl">{title}</h2>
          <div className="gold-line" />
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: cfg } = trpc.site.settings.useQuery();
  const { data: stats } = trpc.site.stats.useQuery();
  const { data: team } = trpc.team.public.useQuery();
  const c = cfg ?? ({} as Record<string, string>);
  const programs = parse(c.programs), features = parse(c.features);
  const steps = [1, 2, 3].map((n) => ({ title: c[`how_${n}_title`], text: c[`how_${n}_text`] }));
  const statItems = [[Users, "طالب وطالبة", stats?.students], [UserRound, "معلم ومعلمة", stats?.teachers], [Layers, "حلقة قرآنية", stats?.circles], [BookOpen, "وجه مُسمَّع", stats?.pages]] as const;

  return (
    <div id="top">
      <SiteHeader />

      {/* الواجهة الرئيسية */}
      <section className="relative overflow-hidden">
        <div className="pattern-gold pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(184,147,47,.14),transparent_55%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-4xl flex-col items-center justify-center px-4 pb-16 pt-12 text-center">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-4 py-1.5 text-sm font-bold text-[#8a6a14] shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />دورات قرآنية مكثفة · منذ {c.since ?? "١٤٤٦هـ"}
          </span>
          <h1 className="animate-rise mt-8 font-amiri text-[6.5rem] font-bold leading-[1.35] text-navy md:text-[10rem]" style={{ animationDelay: ".1s" }}>{c.site_name ?? "حُبُك"}</h1>
          <div className="ornament -mt-2 animate-rise" style={{ animationDelay: ".2s" }}><span className="text-lg">۞</span></div>
          <p className="mt-5 max-w-2xl animate-rise text-xl leading-relaxed text-navy/75 md:text-2xl" style={{ animationDelay: ".25s" }}>{c.hero_tagline}</p>
          <p className="mt-4 animate-rise font-amiri text-lg text-gold md:text-xl" style={{ animationDelay: ".3s" }}>﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</p>
          <div className="mt-9 flex animate-rise flex-wrap justify-center gap-3" style={{ animationDelay: ".4s" }}>
            <Button asChild size="lg" className="shadow-lg shadow-navy/20"><Link to="/register"><GraduationCap className="h-5 w-5" />سجّل الآن</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="#about">تعرّف علينا</a></Button>
          </div>
          <div className="mt-12 flex animate-rise flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-navy/60" style={{ animationDelay: ".5s" }}>
            {[[ShieldCheck, "معلمون مجازون"], [Clock3, "خطط مكثفة واضحة"], [MessageCircle, "متابعة لولي الأمر"]].map(([I, l]) => { const Icon = I as typeof Clock3; return <span key={l as string} className="inline-flex items-center gap-1.5"><Icon className="h-4 w-4 text-gold" />{l as string}</span>; })}
          </div>
        </div>
      </section>

      {/* شريط الإحصاءات */}
      <section id="stats" className="relative scroll-mt-16 overflow-hidden bg-navy py-14 text-white">
        <div className="pattern-light pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:gap-6">
          {statItems.map(([Icon, label, val], i) => (
            <Reveal key={label} delay={i * 120} className="rounded-2xl border border-white/10 bg-white/[.04] p-6 text-center backdrop-blur-sm">
              <Icon className="mx-auto mb-3 h-7 w-7 text-gold-400" />
              <div className="font-amiri text-5xl font-bold">{val === undefined ? "…" : <Counter to={Number(val)} />}</div>
              <div className="mt-1 text-sm text-white/65">{label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <Section id="about" title="عن حُبُك" icon={<HeartHandshake className="h-7 w-7" />} tone="white">
        <Reveal><p className="mx-auto max-w-3xl text-center text-lg leading-loose text-navy/80 md:text-xl md:leading-loose">{c.about_text}</p></Reveal>
      </Section>

      <Section id="programs" title="برامجنا" kicker="اختر مسارك">
        <div className="grid gap-5 md:grid-cols-3">
          {programs.map((p, i) => { const I = PROG_ICONS[i % PROG_ICONS.length]; return (
            <Reveal key={i} delay={i * 100}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-gold/20 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/10">
                <span className="absolute -left-3 -top-6 font-amiri text-[7rem] font-bold leading-none text-gold/[.07]">{(i + 1).toLocaleString("ar-SA")}</span>
                <div className="relative mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-navy text-gold-400 transition group-hover:bg-gold group-hover:text-white"><I className="h-6 w-6" /></div>
                <h3 className="relative mb-2 text-xl font-extrabold">{p.title}</h3>
                <p className="relative leading-relaxed text-navy/70">{p.text}</p>
                <Link to="/register" className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold transition hover:gap-2.5">سجّل في البرنامج<ArrowLeft className="h-4 w-4" /></Link>
              </div>
            </Reveal>); })}
        </div>
      </Section>

      <Section id="features" title="منظومة متكاملة" kicker="كل ما تحتاجه الدورة في مكان واحد" tone="white">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => { const I = FEAT_ICONS[i % FEAT_ICONS.length]; return <Reveal key={i} delay={(i % 3) * 100}><div className="flex h-full gap-4 rounded-2xl border border-transparent bg-ivory p-6 transition hover:border-gold/30 hover:bg-white hover:shadow-md">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-gold-400"><I className="h-5 w-5" /></div>
            <div><h3 className="mb-1 font-extrabold">{f.title}</h3><p className="text-sm leading-relaxed text-navy/70">{f.text}</p></div></div></Reveal>; })}
        </div>
      </Section>

      <Section id="how" title={c.how_title ?? "كيف يعمل"} kicker="ثلاث خطوات بسيطة">
        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <div className="absolute inset-x-[16%] top-8 hidden h-px bg-gradient-to-l from-gold/0 via-gold/60 to-gold/0 md:block" />
          {steps.map((s, i) => <Reveal key={i} delay={i * 150} className="relative text-center">
            <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border-2 border-gold bg-ivory font-amiri text-3xl font-bold text-gold shadow-[0_0_0_8px_#faf7f0]">{(i + 1).toLocaleString("ar-SA")}</div>
            <h3 className="mb-2 text-xl font-extrabold">{s.title}</h3><p className="mx-auto max-w-xs text-navy/70">{s.text}</p></Reveal>)}
        </div>
      </Section>

      <Section id="team" title="فريق العمل" tone="white">
        {team && team.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => <Reveal key={m.id} delay={(i % 4) * 90}><div className="h-full rounded-3xl border border-navy/10 p-6 text-center transition hover:-translate-y-1 hover:shadow-lg">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-navy to-navy-700 font-amiri text-3xl text-gold-400 ring-4 ring-gold-100">{m.name.trim()[0]}</div>
            <h3 className="font-extrabold">{m.name}</h3>{m.role && <p className="mt-0.5 text-sm font-bold text-gold">{m.role}</p>}{m.bio && <p className="mt-2 text-sm leading-relaxed text-navy/60">{m.bio}</p>}</div></Reveal>)}
        </div> : <p className="text-center text-navy/50">{c.team_empty_text}</p>}
      </Section>

      <section className="px-4 py-16">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-navy px-6 py-16 text-center text-white shadow-2xl shadow-navy/30">
          <div className="pattern-light pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,178,90,.25),transparent_60%)]" />
          <div className="relative">
            <h2 className="font-amiri text-4xl font-bold md:text-5xl">{c.cta_title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/75">{c.cta_text}</p>
            <Button asChild variant="gold" size="lg" className="mt-8 shadow-lg shadow-black/20"><Link to="/register"><CheckCircle2 className="h-5 w-5" />نموذج التسجيل</Link></Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-navy/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div><Logo /><p className="mt-3 max-w-xs text-sm leading-relaxed text-navy/60">{c.center_name}</p></div>
          <div>
            <h4 className="mb-3 font-extrabold">روابط سريعة</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm text-navy/65">{NAV.map(([h, l]) => <li key={h}><a href={h} className="hover:text-gold">{l}</a></li>)}</ul>
          </div>
          <div>
            <h4 className="mb-3 font-extrabold">انضم إلينا</h4>
            <p className="mb-4 text-sm text-navy/60">التسجيل متاح للطلاب والمعلمين.</p>
            <div className="flex gap-2"><Button asChild size="sm"><Link to="/register">سجّل الآن</Link></Button><Button asChild size="sm" variant="outline"><Link to="/login">دخول الإدارة</Link></Button></div>
          </div>
        </div>
        <div className="border-t border-navy/5 py-5 text-center text-xs text-navy/50">© {new Date().getFullYear()} {c.site_name ?? "حُبُك"} — جميع الحقوق محفوظة</div>
      </footer>
    </div>
  );
}
