import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const translateError = (msg: string, t: any): string => {
  if (msg.includes("Invalid login credentials")) return t("error_invalid_credentials");
  return t("error_generic");
};

const LoginPage = () => {
  const { t } = useTranslation("auth");
  const { signIn } = useAuth();

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-background p-6 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[380px] space-y-8">
        <div className="flex justify-center">
          <Logo variant="full" />
        </div>

        {mode === "forgot" ? (
          <>
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold">{t("forgot_password_title")}</h2>
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
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-bold">{t("login_title")}</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  required
                />
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("login_button")}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>
                <button onClick={() => setMode("forgot")} className="text-primary font-medium hover:underline">
                  {t("forgot_password")}
                </button>
              </p>
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← {t("back_to_home", "Retour à l'accueil")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
