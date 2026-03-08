import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import Tagline from "@/components/Tagline";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const getPasswordStrength = (pw: string): "weak" | "medium" | "strong" => {
  if (pw.length < 8) return "weak";
  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return score >= 4 ? "strong" : score >= 2 ? "medium" : "weak";
};

const strengthColors = { weak: "bg-destructive", medium: "bg-yellow-500", strong: "bg-green-500" };
const strengthWidths = { weak: "w-1/3", medium: "w-2/3", strong: "w-full" };

const translateError = (msg: string, t: any): string => {
  if (msg.includes("Invalid login credentials")) return t("error_invalid_credentials");
  if (msg.includes("already registered") || msg.includes("already been registered")) return t("error_email_taken");
  if (msg.includes("weak_password") || msg.includes("too weak")) return t("error_weak_password");
  return t("error_generic");
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const { signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [mode, setMode] = useState<"login" | "signup" | "forgot">(inviteToken ? "signup" : "login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Store invite token for use during onboarding
  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem("f6gym-invite", inviteToken);
    }
  }, [inviteToken]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const isSignupValid = email && password.length >= 8 && password === passwordConfirm;
  const isLoginValid = email && password.length >= 1;

  const isInviteFlow = !!inviteToken;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(translateError(error.message, t));
      } else {
        toast.success(t("login_success"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) return;
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(translateError(error.message, t));
      } else {
        toast.success(t("signup_success"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast.success(t("forgot_password_sent"));
      setMode("login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-secondary">
        <div className="relative z-10 px-12 text-center">
          <div className="flex justify-center mb-8">
            <Logo variant="full" />
          </div>
          <Tagline className="text-xl max-w-md mx-auto leading-relaxed" />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden flex justify-center mb-4">
            <Logo variant="full" />
          </div>

          {/* Invite banner for student signup */}
          {isInviteFlow && mode === "signup" && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-sm font-medium text-primary">{t("invite_signup_banner")}</p>
            </div>
          )}

          {mode === "forgot" ? (
            <>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">{t("forgot_password_title")}</h2>
                <p className="text-muted-foreground text-sm">{t("forgot_password_desc")}</p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">{t("email")}</Label>
                  <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("send_reset")}
                </Button>
              </form>
              <p className="text-center text-sm">
                <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                  {t("back_to_login")}
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">
                  {mode === "login" ? t("login_title") : isInviteFlow ? t("invite_signup_title") : t("signup_title")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mode === "login" ? t("login_subtitle") : isInviteFlow ? t("invite_signup_subtitle") : t("signup_subtitle")}
                </p>
              </div>

              <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={mode === "signup" ? 8 : 1}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "signup" && password.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strengthColors[strength]} ${strengthWidths[strength]}`} />
                      </div>
                      <p className={`text-xs ${strength === "weak" ? "text-destructive" : strength === "medium" ? "text-yellow-600" : "text-green-600"}`}>
                        {t(`password_strength_${strength}`)} — {t("password_min")}
                      </p>
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">{t("password_confirm")}</Label>
                    <Input
                      id="password-confirm"
                      type="password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    {passwordConfirm && password !== passwordConfirm && (
                      <p className="text-xs text-destructive">{t("password_mismatch")}</p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full"
                  disabled={loading || (mode === "signup" ? !isSignupValid : !isLoginValid)}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {mode === "login" ? t("login_button") : t("signup_button")}
                </Button>
              </form>

              <div className="space-y-2 text-center text-sm text-muted-foreground">
                {/* In invite flow, don't show "create account" link — only login toggle */}
                {isInviteFlow ? (
                  <p>
                    {t("has_account")}{" "}
                    <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                      {t("login_link")}
                    </button>
                  </p>
                ) : (
                  <p>
                    {mode === "login" ? t("no_account") : t("has_account")}{" "}
                    <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-medium hover:underline">
                      {mode === "login" ? t("signup_link") : t("login_link")}
                    </button>
                  </p>
                )}
                {mode === "login" && (
                  <p>
                    <button onClick={() => setMode("forgot")} className="text-primary font-medium hover:underline">
                      {t("forgot_password")}
                    </button>
                  </p>
                )}
                {/* Coach-only signup notice */}
                {mode === "signup" && !isInviteFlow && (
                  <p className="text-xs text-muted-foreground mt-2">{t("signup_coach_only_notice")}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
