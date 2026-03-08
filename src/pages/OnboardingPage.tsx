import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Dumbbell, HeartPulse } from "lucide-react";
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
  const [step, setStep] = useState<"role" | "profile">(profile?.role ? "profile" : "role");
  const [selectedRole, setSelectedRole] = useState<"coach" | "student" | null>(profile?.role as any ?? null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleRoleSelect = async (role: "coach" | "student") => {
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
      await refreshProfile();
      navigate(selectedRole === "coach" ? "/coach" : "/student", { replace: true });
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-8">
        <div className="flex justify-center">
          <Logo variant="full" />
        </div>

        {step === "role" ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">{t("onboarding_role_title")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRoleSelect("coach")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-accent/50 transition-all text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Dumbbell className="w-7 h-7 text-accent-foreground" />
                </div>
                <span className="text-lg font-semibold">{t("onboarding_role_coach")}</span>
                <span className="text-sm text-muted-foreground">{t("onboarding_role_coach_desc")}</span>
              </button>
              <button
                onClick={() => handleRoleSelect("student")}
                disabled={loading}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-accent/50 transition-all text-center group"
              >
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <HeartPulse className="w-7 h-7 text-accent-foreground" />
                </div>
                <span className="text-lg font-semibold">{t("onboarding_role_student")}</span>
                <span className="text-sm text-muted-foreground">{t("onboarding_role_student_desc")}</span>
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
      </div>
    </div>
  );
};

export default OnboardingPage;
