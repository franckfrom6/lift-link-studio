import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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

const AuthPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"coach" | "student">("coach");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("login_success", "Connexion réussie"));
          setTimeout(() => navigate("/coach"), 500);
        }
      } else {
        const { error } = await signUp(email, password, role, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("signup_success", "Compte créé ! Vérifiez votre email."));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-secondary">
        <div className="relative z-10 px-12 text-center">
          <div className="flex justify-center mb-8">
            <Logo variant="full" />
          </div>
          <Tagline className="text-xl max-w-md mx-auto leading-relaxed" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-4">
            <Logo variant="full" />
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">
              {isLogin ? t("login_title", "Connexion") : t("signup_title", "Créer un compte")}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? t("login_subtitle", "Connectez-vous à votre espace") : t("signup_subtitle", "Rejoignez F6GYM")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("full_name", "Nom complet")}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Franck Berthelot" required />
                </div>
                <div className="space-y-2">
                  <Label>{t("role", "Rôle")}</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={role === "coach" ? "default" : "outline"} className="flex-1" onClick={() => setRole("coach")}>Coach</Button>
                    <Button type="button" variant={role === "student" ? "default" : "outline"} className="flex-1" onClick={() => setRole("student")}>{t("student", "Élève")}</Button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="franck@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password", "Mot de passe")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLogin ? t("login_button", "Se connecter") : t("signup_button", "Créer mon compte")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? t("no_account", "Pas encore de compte ?") : t("has_account", "Déjà un compte ?")}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? t("signup_link", "S'inscrire") : t("login_link", "Se connecter")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
