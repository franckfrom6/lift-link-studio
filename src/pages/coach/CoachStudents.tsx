import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CoachStudents = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Mes Élèves</h1>
          <p className="text-muted-foreground text-sm">Gérez vos élèves et leurs programmes</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Inviter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un élève..." className="pl-10 h-11 bg-surface" />
      </div>

      {/* Empty state */}
      <div className="glass rounded-xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-display font-semibold">Aucun élève</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Invitez un élève par email pour commencer à lui créer un programme d'entraînement.
        </p>
      </div>
    </div>
  );
};

export default CoachStudents;
