import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Dumbbell, HeartPulse, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OnboardingPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  // Check if this is an invite flow (student)
  const inviteToken = localStorage.getItem("6way-invite");
  const isInviteFlow = !!inviteToken;

  const [step, setStep] = useState<"role" | "profile">(
    isInviteFlow ? "profile" : (profile?.role ? "profile" : "role")
  );
  const [selectedRole, setSelectedRole] = useState<"coach" | "student" | null>(
    isInviteFlow ? "student" : (profile?.role as any ?? null)
  );
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState(() => localStorage.getItem("f6gym-firstname") || "");
  const [lastName, setLastName] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const totalSteps = isInviteFlow ? 1 : 2;
  const currentStepIndex = step === "role" ? 1 : 2;
  const progressPct = Math.round((currentStepIndex / totalSteps) * 100);

  // Auto-assign student role if invite flow
  useEffect(() => {
    if (isInviteFlow && user && !profile?.role) {
      const assignStudentRole = async () => {
        setLoading(true);
        try {
          await supabase.from("profiles").update({ role: "student" }).eq("user_id", user.id);
          await refreshProfile();
        } catch {
          toast.error(t("error_generic"));
        } finally {
          setLoading(false);
        }
      };
      assignStudentRole();
    }
  }, [isInviteFlow, user, profile?.role]);

  const handleRoleSelect = async (role: "coach" | "student") => {
    // Only coaches can select role from onboarding — block student selection without invite
    if (role === "student") {
      toast.error(t("signup_student_need_invite"));
      return;
    }
    if (!user) return;
    setSelectedRole(role);
    setLoading(true);
    try {
      await supabase.from("profiles").update({ role }).eq("user_id", user.id);
      await refreshProfile();
      setStep("profile");
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const name = selectedRole === "coach" ? fullName : `${firstName} ${lastName}`.trim();
      await supabase.from("profiles").update({
        full_name: name,
        onboarding_completed: true,
      }).eq("user_id", user.id);

      // Clean up invite token
      if (inviteToken) {
        localStorage.removeItem("6way-invite");
      }
      localStorage.removeItem("f6gym-firstname");

      await refreshProfile();
      setCelebrate(true);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#1A3CFF", "#FF6A1A", "#22c55e"] });
      } catch {}
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartFirstSession = () => {
    navigate(selectedRole === "coach" ? "/coach" : "/student", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <Logo variant="full" />
        </div>

        {celebrate ? (
          <div className="text-center space-y-5 py-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <PartyPopper className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold">🎉 Tu es prêt !</h2>
            <ul className="text-sm text-muted-foreground space-y-1.5 max-w-xs mx-auto text-left">
              <li>✅ Profil configuré</li>
              <li>✅ Rôle {selectedRole === "coach" ? "coach" : "athlète"} activé</li>
              <li>✅ Espace personnel prêt</li>
            </ul>
            <Button className="w-full max-w-sm mx-auto" onClick={handleStartFirstSession}>
              {selectedRole === "coach" ? "Accéder à mon espace coach" : "Démarrer ma première séance"} →
            </Button>
          </div>
        ) : (
          <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Étape {currentStepIndex} / {totalSteps}</span>
              <span className="tabular-nums">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

        {step === "role" ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">{t("onboarding_role_title")}</h2>
            <p className="text-center text-sm text-muted-foreground">{t("signup_coach_only_notice")}</p>
            <div className="flex justify-center">
              <button
                onClick={() => handleRoleSelect("coach")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-accent/50 transition-all text-center group w-64"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Dumbbell className="w-7 h-7 text-accent-foreground" />
                </div>
                <span className="text-lg font-semibold">{t("onboarding_role_coach")}</span>
                <span className="text-sm text-muted-foreground">{t("onboarding_role_coach_desc")}</span>
              </button>
            </div>
            {loading && (
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">{t("onboarding_profile_title")}</h2>
            {isInviteFlow && (
              <p className="text-center text-sm text-muted-foreground">{t("invite_onboarding_notice")}</p>
            )}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {selectedRole === "coach" ? (
                <div className="space-y-2">
                  <Label>{t("onboarding_fullname")}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("onboarding_firstname")}</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding_lastname")}</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading || (selectedRole === "coach" ? !fullName : !firstName || !lastName)}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("onboarding_continue")} →
              </Button>
            </form>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
