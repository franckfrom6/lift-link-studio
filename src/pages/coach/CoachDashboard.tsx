import { useAuth } from "@/contexts/AuthContext";
import { Users, ClipboardList, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CoachDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-display font-bold">
          Bonjour, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "Coach"}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Voici un aperçu de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Élèves actifs</span>
          </div>
          <p className="text-3xl font-display font-bold">0</p>
        </div>
        <div className="glass rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-4 h-4" />
            <span className="text-sm font-medium">Programmes actifs</span>
          </div>
          <p className="text-3xl font-display font-bold">0</p>
        </div>
        <div className="glass rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Séances cette semaine</span>
          </div>
          <p className="text-3xl font-display font-bold">0</p>
        </div>
      </div>

      {/* Empty state */}
      <div className="glass rounded-xl p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-display font-semibold">Aucun élève pour l'instant</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Invitez votre premier élève pour commencer à créer des programmes personnalisés.
        </p>
        <Button onClick={() => navigate("/coach/students")} className="mt-2">
          <Plus className="w-4 h-4 mr-2" />
          Inviter un élève
        </Button>
      </div>
    </div>
  );
};

export default CoachDashboard;
