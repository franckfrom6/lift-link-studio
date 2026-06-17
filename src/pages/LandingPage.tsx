import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Loader2, ChevronDown, Watch, Activity, HeartPulse } from "lucide-react";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════
   6way Landing — premium editorial, double-cible (coachs/athlètes)
   Fond crème #F4F1EA. Orange utilisé en accent rare.
   ════════════════════════════════════════════════════════════════ */

const CREAM = "#F4F1EA";
const INK = "#0A0A0B";
const ACCENT = "#E84A14";
const LINE = "#E5E3DC";
const DIM = "#6B6B72";

const sectionPad = "py-20 md:py-32 px-6";

/* Reusable micro-label */
const MicroLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`font-mono text-[11px] font-medium uppercase ${className}`}
    style={{ letterSpacing: "0.2em", color: DIM }}
  >
    {children}
  </div>
);

/* Display heading (Fraunces italic) */
const Display = ({
  as: As = "h2",
  size = "h2",
  children,
  className = "",
  style,
}: {
  as?: any;
  size?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const sizes = {
    h1: "text-[clamp(48px,12vw,128px)]",
    h2: "text-[clamp(36px,6vw,72px)]",
    h3: "text-[clamp(28px,4vw,40px)]",
  };
  return (
    <As
      className={`font-display italic font-light leading-[0.95] ${sizes[size]} ${className}`}
      style={{ letterSpacing: "-0.03em", color: INK, ...style }}
    >
      {children}
    </As>
  );
};

const TagPill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center font-mono text-[11px] font-medium px-3 py-1.5 rounded-full"
    style={{
      backgroundColor: "rgba(232, 74, 20, 0.08)",
      border: "1px solid rgba(232, 74, 20, 0.25)",
      color: ACCENT,
      letterSpacing: "0.2em",
    }}
  >
    {children}
  </span>
);

const LandingPage = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === "coach" ? "/coach" : "/student", { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: DIM }} />
      </div>
    );
  }
  if (user && role) return null;

  return (
    <div
      className="min-h-[100dvh] font-sans antialiased"
      style={{ backgroundColor: CREAM, color: INK }}
    >
      <Nav />
      <Hero />
      <SplitChooser />
      <AthletesSection />
      <IntegrationsSection />
      <CoachsSection />
      <SystemSection />
      <WhyNowSection />
      <WaitlistSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

/* ───────────────────────── NAV ───────────────────────── */
const Nav = () => {
  const { t } = useTranslation("landing");
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(244, 241, 234, 0.85)",
        borderBottom: `1px solid ${LINE}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Logo variant="header" />
        <div className="hidden md:flex items-center gap-8">
          {[
            { k: "nav_athletes", id: "athletes" },
            { k: "nav_coachs", id: "coachs" },
            { k: "nav_system", id: "system" },
            { k: "nav_faq", id: "faq" },
          ].map(({ k, id }) => (
            <button
              key={k}
              onClick={() => scrollTo(id)}
              className="font-mono text-[11px] font-medium uppercase hover:opacity-60 transition-opacity"
              style={{ letterSpacing: "0.2em", color: INK }}
            >
              {t(k)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden lg:block font-mono text-[11px]" style={{ color: DIM, letterSpacing: "0.1em" }}>
            · {t("nav_signup_count")}
          </span>
          <LanguageSwitcher />
          <Link
            to="/login"
            className="text-sm font-medium hover:opacity-60 transition-opacity"
            style={{ color: DIM }}
          >
            {t("nav_login")}
          </Link>
          <button
            onClick={() => scrollTo("waitlist")}
            className="font-sans text-sm font-semibold px-4 py-2.5 rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: INK, color: CREAM }}
          >
            {t("nav_cta")}
          </button>
        </div>
      </div>
    </nav>
  );
};

/* ───────────────────────── HERO ───────────────────────── */
const Hero = () => {
  const { t } = useTranslation("landing");
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className={`${sectionPad} pt-20 md:pt-24`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <TagPill>{t("hero_tag")}</TagPill>
        </div>
        <Display as="h1" size="h1" className="mb-10">
          <div>{t("hero_title_1")}</div>
          <div>{t("hero_title_2")}</div>
          <div style={{ color: ACCENT }}>{t("hero_title_3")}</div>
        </Display>
        <p
          className="text-lg md:text-xl font-normal leading-relaxed max-w-[600px] mb-10"
          style={{ color: DIM }}
        >
          {t("hero_subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <button
            onClick={() => scrollTo("waitlist")}
            className="font-sans text-base font-semibold px-7 py-4 rounded-full transition-transform active:scale-95"
            style={{ backgroundColor: INK, color: CREAM }}
          >
            {t("hero_cta_primary")}
          </button>
          <button
            onClick={() => scrollTo("coachs")}
            className="font-sans text-base font-medium px-7 py-4 rounded-full transition-colors hover:bg-black/5"
            style={{ border: `1px solid ${INK}`, color: INK }}
          >
            {t("hero_cta_secondary")}
          </button>
        </div>
        <MicroLabel>{t("hero_meta")}</MicroLabel>
      </div>
    </section>
  );
};

/* ──────────────────────── SPLIT CHOOSER ──────────────────────── */
const SplitChooser = () => {
  const { t } = useTranslation("landing");
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const cards: Array<{ label: string; title: string; body: string; link: string; target: string }> = [
    {
      label: "split_left_label",
      title: "split_left_title",
      body: "split_left_body",
      link: "split_left_link",
      target: "athletes",
    },
    {
      label: "split_right_label",
      title: "split_right_title",
      body: "split_right_body",
      link: "split_right_link",
      target: "coachs",
    },
  ];
  return (
    <section className={`${sectionPad} pt-10`}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => scrollTo(c.target)}
            className="text-left p-8 md:p-10 rounded-3xl transition-all hover:-translate-y-1"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${LINE}` }}
          >
            <MicroLabel className="mb-6">{t(c.label)}</MicroLabel>
            <Display size="h3" className="mb-4">
              {t(c.title)}
            </Display>
            <p className="text-base leading-relaxed mb-6" style={{ color: DIM }}>
              {t(c.body)}
            </p>
            <span className="font-sans italic text-base" style={{ color: ACCENT }}>
              {t(c.link)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

/* ──────────────────────── ATHLETES SECTION ──────────────────────── */
const FeatureCard = ({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) => (
  <div
    className="p-8 rounded-2xl h-full"
    style={{ backgroundColor: "#FFFFFF", border: `1px solid ${LINE}` }}
  >
    <div className="font-mono text-sm mb-6" style={{ color: ACCENT, letterSpacing: "0.1em" }}>
      {`// ${String(index).padStart(2, "0")}`}
    </div>
    <h3 className="font-sans text-[22px] font-extrabold mb-3 leading-tight" style={{ color: INK }}>
      {title}
    </h3>
    <p className="text-[15px] leading-relaxed" style={{ color: DIM }}>
      {body}
    </p>
  </div>
);

const AthletesSection = () => {
  const { t } = useTranslation("landing");
  return (
    <section id="athletes" className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <MicroLabel className="mb-6">{t("athletes_section_label")}</MicroLabel>
          <Display className="mb-6">{t("athletes_section_title")}</Display>
          <p className="text-lg leading-relaxed" style={{ color: DIM }}>
            {t("athletes_section_sub")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          <FeatureCard index={1} title={t("athletes_f1_title")} body={t("athletes_f1_body")} />
          <FeatureCard index={2} title={t("athletes_f2_title")} body={t("athletes_f2_body")} />
          <FeatureCard index={3} title={t("athletes_f3_title")} body={t("athletes_f3_body")} />
        </div>
        <div
          className="font-mono text-[11px] font-medium uppercase text-center py-6 px-4 rounded-2xl"
          style={{
            letterSpacing: "0.18em",
            color: DIM,
            border: `1px dashed ${LINE}`,
          }}
        >
          {t("athletes_strip")}
        </div>
        {/* TODO: replace placeholder testimonial once we have real ones */}
        <figure className="mt-16 max-w-3xl mx-auto text-center">
          <blockquote>
            <Display size="h3" as="p">
              “{t("athletes_testimonial_quote")}”
            </Display>
          </blockquote>
          <figcaption className="mt-6 font-mono text-[11px] uppercase" style={{ color: DIM, letterSpacing: "0.18em" }}>
            — {t("athletes_testimonial_author")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
};

/* ──────────────────────── INTEGRATIONS (coming soon) ──────────────────────── */
const IntegrationsSection = () => {
  const { t } = useTranslation("landing");
  const items: Array<{ icon: any; title: string; body: string }> = [
    { icon: Watch, title: "integrations_garmin_title", body: "integrations_garmin_body" },
    { icon: Activity, title: "integrations_strava_title", body: "integrations_strava_body" },
    { icon: HeartPulse, title: "integrations_apple_title", body: "integrations_apple_body" },
  ];
  return (
    <section id="integrations" className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <MicroLabel className="mb-6">{t("integrations_label")}</MicroLabel>
          <Display className="mb-6">{t("integrations_title")}</Display>
          <p className="text-lg leading-relaxed" style={{ color: DIM }}>
            {t("integrations_sub")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-8 rounded-2xl h-full"
              style={{ backgroundColor: "#FFFFFF", border: `1px solid ${LINE}` }}
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(232, 74, 20, 0.08)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: ACCENT }} strokeWidth={1.75} />
                </div>
                <span
                  className="font-mono text-[10px] font-medium uppercase px-2.5 py-1 rounded-full"
                  style={{ letterSpacing: "0.15em", color: DIM, border: `1px solid ${LINE}` }}
                >
                  {t("integrations_badge")}
                </span>
              </div>
              <h3 className="font-sans text-[22px] font-extrabold mb-3 leading-tight" style={{ color: INK }}>
                {t(title)}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: DIM }}>
                {t(body)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── COACHS SECTION ──────────────────────── */
const CoachsSection = () => {
  const { t } = useTranslation("landing");
  return (
    <section id="coachs" className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <MicroLabel className="mb-6">{t("coachs_section_label")}</MicroLabel>
          <Display className="mb-6">{t("coachs_section_title")}</Display>
          <p className="text-lg leading-relaxed" style={{ color: DIM }}>
            {t("coachs_section_sub")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          <FeatureCard index={1} title={t("coachs_f1_title")} body={t("coachs_f1_body")} />
          <FeatureCard index={2} title={t("coachs_f2_title")} body={t("coachs_f2_body")} />
          <FeatureCard index={3} title={t("coachs_f3_title")} body={t("coachs_f3_body")} />
          <FeatureCard index={4} title={t("coachs_f4_title")} body={t("coachs_f4_body")} />
        </div>
        {/* Pricing teaser — TODO: validate pricing with Franck before public launch */}
        <div
          className="p-8 md:p-12 rounded-3xl text-center max-w-3xl mx-auto"
          style={{ backgroundColor: "#FFFFFF", border: `1px solid ${LINE}` }}
        >
          <MicroLabel className="mb-6">{t("coachs_pricing_label")}</MicroLabel>
          <Display size="h3" className="mb-4">
            {t("coachs_pricing_title")}
          </Display>
          <p className="text-base leading-relaxed mb-6 max-w-xl mx-auto" style={{ color: DIM }}>
            {t("coachs_pricing_body")}
          </p>
          <Link to="/pricing" className="font-sans italic text-base" style={{ color: ACCENT }}>
            {t("coachs_pricing_link")}
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── 6 WAYS SYSTEM ──────────────────────── */
const SystemSection = () => {
  const { t } = useTranslation("landing");
  const items = [1, 2, 3, 4, 5, 6];
  return (
    <section id="system" className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <MicroLabel className="mb-6">{t("system_label")}</MicroLabel>
          <Display className="mb-6">{t("system_title")}</Display>
          <p className="text-lg leading-relaxed" style={{ color: DIM }}>
            {t("system_sub")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((i) => (
            <div
              key={i}
              className="p-8 rounded-2xl"
              style={{ backgroundColor: "#FFFFFF", border: `1px solid ${LINE}` }}
            >
              <div
                className="font-mono text-sm mb-5"
                style={{ color: ACCENT, letterSpacing: "0.1em" }}
              >
                {`// 0${i}`}
              </div>
              <div
                className="font-mono text-[11px] uppercase mb-3"
                style={{ color: DIM, letterSpacing: "0.2em" }}
              >
                {t(`system_${i}_name`)}
              </div>
              <Display size="h3" className="mb-4">
                {t(`system_${i}_title`)}
              </Display>
              <p className="text-[15px] leading-relaxed" style={{ color: DIM }}>
                {t(`system_${i}_body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── WHY NOW ──────────────────────── */
const WhyNowSection = () => {
  const { t } = useTranslation("landing");
  return (
    <section className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-3xl">
          <MicroLabel className="mb-6">{t("why_label")}</MicroLabel>
          <Display>{t("why_title")}</Display>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <h3 className="font-sans text-lg font-bold mb-3" style={{ color: INK }}>
                {t(`why_${i}_title`)}
              </h3>
              <p className="text-base leading-relaxed" style={{ color: DIM }}>
                {t(`why_${i}_body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── WAITLIST ──────────────────────── */
const WaitlistSection = () => {
  const { t } = useTranslation("landing");
  const [email, setEmail] = useState("");
  const [formRole, setFormRole] = useState<"athlete" | "coach">("athlete");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const id = crypto.randomUUID();
    const cleanEmail = email.trim().toLowerCase();
    // Derive a placeholder name from the email so we don't break the existing
    // pilot_requests NOT NULL constraints on first_name / last_name.
    const localPart = cleanEmail.split("@")[0] || "waitlist";
    const { error } = await supabase.from("pilot_requests" as any).insert({
      id,
      first_name: localPart,
      last_name: "—",
      email: cleanEmail,
      role: formRole,
      objective: null,
    } as any);
    setSending(false);
    if (error) {
      console.error(error);
      toast.error(t("waitlist_error"));
      return;
    }
    setSent(true);
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "pilot-request-received",
          recipientEmail: cleanEmail,
          idempotencyKey: `pilot-request-received-${id}`,
          templateData: { firstName: localPart, role: formRole },
        },
      })
      .catch((err) => console.error("Confirmation email failed", err));
  };

  return (
    <section
      id="waitlist"
      className={sectionPad}
      style={{ backgroundColor: INK, color: CREAM, borderTop: `1px solid ${LINE}` }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <TagPill>{t("waitlist_tag")}</TagPill>
        </div>
        <Display className="mb-6" style={{ color: CREAM }}>
          {t("waitlist_title")}
        </Display>
        <p className="text-lg leading-relaxed max-w-[560px] mx-auto mb-12" style={{ color: "rgba(244,241,234,0.7)" }}>
          {t("waitlist_body")}
        </p>

        {sent ? (
          <p className="font-sans text-lg" style={{ color: CREAM }}>
            {t("waitlist_success")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto text-left">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("waitlist_email_placeholder")}
                className="flex-1 px-5 py-4 rounded-full font-sans text-base outline-none focus:ring-2"
                style={{
                  backgroundColor: "rgba(244,241,234,0.08)",
                  border: "1px solid rgba(244,241,234,0.2)",
                  color: CREAM,
                }}
              />
              <button
                type="submit"
                disabled={sending || !email}
                className="font-sans text-base font-semibold px-6 py-4 rounded-full transition-transform active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: CREAM, color: INK }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                {t("waitlist_submit")}
              </button>
            </div>
            <fieldset className="flex items-center gap-6 justify-center pt-2">
              <legend className="sr-only">{t("waitlist_role_label")}</legend>
              <span className="font-mono text-[11px] uppercase" style={{ letterSpacing: "0.2em", color: "rgba(244,241,234,0.6)" }}>
                {t("waitlist_role_label")}
              </span>
              {(["athlete", "coach"] as const).map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={formRole === r}
                    onChange={() => setFormRole(r)}
                    className="w-4 h-4 accent-current"
                    style={{ accentColor: ACCENT }}
                  />
                  <span className="font-sans text-sm" style={{ color: CREAM }}>
                    {r === "athlete" ? t("waitlist_role_athlete") : t("waitlist_role_coach")}
                  </span>
                </label>
              ))}
            </fieldset>
          </form>
        )}

        <div
          className="font-mono text-[11px] uppercase mt-10"
          style={{ letterSpacing: "0.18em", color: "rgba(244,241,234,0.45)" }}
        >
          {t("waitlist_legal")}
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── FAQ ──────────────────────── */
const FAQSection = () => {
  const { t } = useTranslation("landing");
  const [open, setOpen] = useState<number | null>(0);
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <section id="faq" className={sectionPad} style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <MicroLabel className="mb-6">{t("faq_label")}</MicroLabel>
          <Display>{t("faq_title")}</Display>
        </div>
        <div>
          {items.map((i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderTop: `1px solid ${LINE}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-base md:text-lg font-semibold" style={{ color: INK }}>
                    {t(`faq_q${i}`)}
                  </span>
                  <ChevronDown
                    className="w-5 h-5 mt-1 flex-shrink-0 transition-transform"
                    style={{
                      color: DIM,
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {isOpen && (
                  <p className="text-base leading-relaxed pb-6 pr-12" style={{ color: DIM }}>
                    {t(`faq_a${i}`)}
                  </p>
                )}
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${LINE}` }} />
        </div>
      </div>
    </section>
  );
};

/* ──────────────────────── FOOTER ──────────────────────── */
const Footer = () => {
  const { t } = useTranslation("landing");
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <footer className="px-6 pt-20 pb-12" style={{ borderTop: `1px solid ${LINE}` }}>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        <div>
          <Logo variant="full" />
          <p className="font-sans text-sm mt-6 max-w-xs" style={{ color: DIM }}>
            {t("footer_tagline")}
          </p>
          <MicroLabel className="mt-4">{t("footer_origin")}</MicroLabel>
        </div>
        <div>
          <MicroLabel className="mb-5">{t("footer_col_product")}</MicroLabel>
          <ul className="space-y-3">
            {[
              { k: "footer_link_athletes", id: "athletes" },
              { k: "footer_link_coachs", id: "coachs" },
              { k: "footer_link_system", id: "system" },
              { k: "footer_link_faq", id: "faq" },
            ].map(({ k, id }) => (
              <li key={k}>
                <button
                  onClick={() => scrollTo(id)}
                  className="font-sans text-sm hover:opacity-60 transition-opacity"
                  style={{ color: INK }}
                >
                  {t(k)}
                </button>
              </li>
            ))}
            <li>
              <Link to="/pricing" className="font-sans text-sm hover:opacity-60 transition-opacity" style={{ color: INK }}>
                {t("footer_link_pricing")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <MicroLabel className="mb-5">{t("footer_col_legal")}</MicroLabel>
          <ul className="space-y-3">
            <li>
              <Link to="/legal/mentions" className="font-sans text-sm hover:opacity-60" style={{ color: INK }}>
                {t("footer_link_mentions")}
              </Link>
            </li>
            <li>
              <Link to="/legal/privacy" className="font-sans text-sm hover:opacity-60" style={{ color: INK }}>
                {t("footer_link_privacy")}
              </Link>
            </li>
            <li>
              <Link to="/legal/terms" className="font-sans text-sm hover:opacity-60" style={{ color: INK }}>
                {t("footer_link_terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div
        className="max-w-6xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[11px] uppercase"
        style={{ borderTop: `1px solid ${LINE}`, color: DIM, letterSpacing: "0.18em" }}
      >
        <span>{t("footer_copyright")}</span>
        <span>{t("footer_triad")}</span>
        <span>{t("footer_locales")}</span>
      </div>
    </footer>
  );
};

export default LandingPage;
