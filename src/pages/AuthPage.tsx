import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, GraduationCap, User, Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";

type Mode = "choose" | "login" | "signup";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");
  const [role, setRole] = useState<"coach" | "student">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "signup") {
      const { error } = await signUp(email, password, role, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Compte créé ! Vous êtes connecté.");
        navigate(role === "coach" ? "/coach" : "/student");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Connecté !");
        // Navigation will be handled by auth state change
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-secondary">
        <div className="relative z-10 px-12 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">FitForge</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Connectez coach et athlètes. Planifiez, suivez et progressez ensemble.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>

        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold">FitForge</h1>
          </div>

          {mode === "choose" ? (
            <>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">Bienvenue sur FitForge</h2>
                <p className="text-muted-foreground">Choisissez votre espace pour commencer</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => { setRole("coach"); setMode("login"); }}
                  className="w-full flex items-center gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Espace Coach</div>
                    <div className="text-sm text-muted-foreground">Gérer les élèves et créer des programmes</div>
                  </div>
                </button>

                <button
                  onClick={() => { setRole("student"); setMode("login"); }}
                  className="w-full flex items-center gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
                    <User className="w-7 h-7 text-accent-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Espace Élève</div>
                    <div className="text-sm text-muted-foreground">Suivre son programme et ses séances</div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <button onClick={() => setMode("choose")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                  Retour
                </button>
                <h2 className="text-2xl font-bold">
                  {mode === "login" ? "Connexion" : "Inscription"} — {role === "coach" ? "Coach" : "Élève"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Yana Dupont" required />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yana@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>Pas encore de compte ? <button onClick={() => setMode("signup")} className="text-foreground font-medium hover:underline">S'inscrire</button></>
                ) : (
                  <>Déjà un compte ? <button onClick={() => setMode("login")} className="text-foreground font-medium hover:underline">Se connecter</button></>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
