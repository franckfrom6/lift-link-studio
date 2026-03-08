import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, Loader2, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"coach" | "student">("student");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Connexion réussie !");
        // Navigation handled by auth state change
      }
    } else {
      if (!fullName.trim()) {
        toast.error("Veuillez entrer votre nom");
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, selectedRole, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Compte créé ! Vérifiez votre email.");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 px-12 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-primary">
              <Dumbbell className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-display font-bold tracking-tight">
              Fit<span className="text-gradient">Forge</span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Connectez coach et athlètes. Planifiez, suivez et progressez ensemble.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold">
              Fit<span className="text-gradient">Forge</span>
            </h1>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-display font-bold">
              {isLogin ? "Content de vous revoir" : "Créer un compte"}
            </h2>
            <p className="text-muted-foreground">
              {isLogin
                ? "Connectez-vous pour accéder à votre espace"
                : "Rejoignez FitForge et commencez votre progression"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="h-12 bg-surface border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Je suis</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("coach")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedRole === "coach"
                          ? "border-primary bg-primary/10 glow-primary"
                          : "border-border bg-surface hover:border-muted-foreground/30"
                      }`}
                    >
                      <GraduationCap className={`w-5 h-5 ${selectedRole === "coach" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Coach</div>
                        <div className="text-xs text-muted-foreground">Je crée des programmes</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("student")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedRole === "student"
                          ? "border-primary bg-primary/10 glow-primary"
                          : "border-border bg-surface hover:border-muted-foreground/30"
                      }`}
                    >
                      <User className={`w-5 h-5 ${selectedRole === "student" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Élève</div>
                        <div className="text-xs text-muted-foreground">Je suis un programme</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="h-12 bg-surface border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-surface border-border"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                "Se connecter"
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Pas encore de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
