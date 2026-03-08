import { useNavigate } from "react-router-dom";
import { Dumbbell, GraduationCap, User } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();

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

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold">
              Fit<span className="text-gradient">Forge</span>
            </h1>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-display font-bold">Bienvenue sur FitForge</h2>
            <p className="text-muted-foreground">Choisissez votre espace pour commencer</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/coach")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border-2 border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-display font-bold text-lg">Espace Coach</div>
                <div className="text-sm text-muted-foreground">Gérer les élèves et créer des programmes</div>
              </div>
            </button>

            <button
              onClick={() => navigate("/student")}
              className="w-full flex items-center gap-4 p-6 rounded-xl border-2 border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-display font-bold text-lg">Espace Élève</div>
                <div className="text-sm text-muted-foreground">Suivre son programme et ses séances</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
