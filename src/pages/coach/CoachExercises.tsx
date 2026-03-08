import { Dumbbell, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CoachExercises = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Bibliothèque d'exercices</h1>
          <p className="text-muted-foreground text-sm">Gérez vos exercices</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un exercice..." className="pl-10 h-11 bg-surface" />
      </div>

      <div className="glass rounded-xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Dumbbell className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-display font-semibold">Bibliothèque vide</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          La bibliothèque d'exercices sera pré-remplie avec les exercices les plus courants.
        </p>
      </div>
    </div>
  );
};

export default CoachExercises;
