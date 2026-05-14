import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Eye, EyeOff, Mail } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  const [firstName, setFirstName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Store invite token for use during onboarding
  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem("f6gym-invite", inviteToken);
    }
  }, [inviteToken]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

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
        if (firstName.trim()) {
          localStorage.setItem("f6gym-firstname", firstName.trim());
        }
        setEmailSent(true);
        setResendCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await supabase.auth.resend({ type: "signup", email });
      toast.success(t("signup_success"));
      setResendCooldown(60);
    } catch {
      toast.error(t("error_generic"));
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

          {emailSent ? (
            <div className="text-center space-y-5 py-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Vérifiez vos emails</h2>
                <p className="text-sm text-muted-foreground">
                  Nous avons envoyé un lien à <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer l'email"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setEmailSent(false); setResendCooldown(0); }}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Modifier l'adresse
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Invite banner for student signup */}
          {isInviteFlow && mode === "signup" && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
              <p className="text-sm font-medium text-primary">{t("invite_signup_banner")}</p>
            </div>
          )}

          {/* Tab toggle */}
          {mode !== "forgot" && !isInviteFlow && (
            <div className="grid grid-cols-2 p-1 rounded-lg bg-muted">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "py-2 text-sm font-semibold rounded-md transition-colors",
                  mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "py-2 text-sm font-semibold rounded-md transition-colors",
                  mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Créer un compte
              </button>
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
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="firstname">Prénom</Label>
                    <Input
                      id="firstname"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Alex"
                      required
                    />
                  </div>
                )}
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
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
