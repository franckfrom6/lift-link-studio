import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Dumbbell, BarChart3, Bot, Smartphone, ArrowDown, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LandingPage = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("landing");

  useEffect(() => {
    if (!loading && user && role) {
      navigate(role === "coach" ? "/coach" : "/student", { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (user && role) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-white/20">
      <Nav />
      <Hero />
      <Features />
      <PilotForm />
      <Footer />
    </div>
  );
};

/* ─── Nav ─── */
const Nav = () => {
  const { t } = useTranslation("landing");
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
        <Logo variant="compact" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            {t("nav_login")}
          </Link>
        </div>
      </div>
    </nav>
  );
};

/* ─── Hero ─── */
const Hero = () => {
  const { t } = useTranslation("landing");
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
          {t("hero_title")}
        </h1>
        <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
          {t("hero_subtitle")}
        </p>
        <a
          href="#pilote"
          className="inline-flex items-center gap-2 bg-white text-[#0a0a0f] px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
        >
          {t("hero_cta")}
          <ArrowDown className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

/* ─── Features ─── */
const FEATURES = [
  { icon: Dumbbell, key: "feat_1" },
  { icon: BarChart3, key: "feat_2" },
  { icon: Bot, key: "feat_3" },
  { icon: Smartphone, key: "feat_4" },
] as const;

const Features = () => {
  const { t } = useTranslation("landing");
  return (
    <section className="py-20 px-6 border-t border-white/[0.06]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8">
        {FEATURES.map(({ icon: Icon, key }) => (
          <div key={key} className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center">
              <Icon className="w-5 h-5 text-white/60" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold">{t(`${key}_title`)}</h3>
            <p className="text-sm text-white/40 leading-relaxed">{t(`${key}_desc`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ─── Pilot Form ─── */
const PilotForm = () => {
  const { t } = useTranslation("landing");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [formRole, setFormRole] = useState<"coach" | "athlete">("athlete");
  const [objective, setObjective] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    setSending(true);
    const { error } = await supabase.from("pilot_requests" as any).insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      role: formRole,
      objective: objective.trim() || null,
    } as any);
    setSending(false);
    if (error) {
      console.error(error);
      toast.error(t("form_error"));
    } else {
      setSent(true);
    }
  };

  return (
    <section id="pilote" className="py-20 px-6 border-t border-white/[0.06]">
      <div className="max-w-lg mx-auto">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">{t("form_title")}</h2>
          <p className="text-sm text-white/40">{t("form_subtitle")}</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-lg font-medium">{t("form_success")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">{t("form_first_name")} *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 focus-visible:ring-white/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/60 text-xs">{t("form_last_name")} *</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 focus-visible:ring-white/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">{t("form_email")} *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nom@exemple.com"
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 focus-visible:ring-white/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">{t("form_role")}</Label>
              <div className="flex gap-2">
                {(["coach", "athlete"] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setFormRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      formRole === r
                        ? "bg-white text-[#0a0a0f] border-white"
                        : "bg-white/[0.04] text-white/50 border-white/[0.1] hover:bg-white/[0.08]"
                    }`}
                  >
                    {r === "coach" ? t("form_role_coach") : t("form_role_athlete")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">{t("form_objective")}</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder={t("form_objective_placeholder")}
                rows={2}
                className="bg-white/[0.06] border-white/[0.1] text-white placeholder:text-white/20 resize-none focus-visible:ring-white/20"
              />
            </div>

            <Button
              type="submit"
              disabled={sending || !firstName || !lastName || !email}
              className="w-full bg-white text-[#0a0a0f] hover:bg-white/90 font-semibold"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("form_submit")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

/* ─── Footer ─── */
const Footer = () => {
  const { t } = useTranslation("landing");
  return (
    <footer className="border-t border-white/[0.06] py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
        <span>{t("footer_copyright")}</span>
        <div className="flex gap-4">
          <Link to="/legal/privacy" className="hover:text-white/60 transition-colors">{t("footer_privacy")}</Link>
          <Link to="/legal/terms" className="hover:text-white/60 transition-colors">{t("footer_terms")}</Link>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage;
