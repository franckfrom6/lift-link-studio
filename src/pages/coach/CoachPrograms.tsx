import { ClipboardList } from "lucide-react";

const CoachPrograms = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold">Programmes</h1>
        <p className="text-muted-foreground text-sm">Créez et gérez les programmes de vos élèves</p>
      </div>

      <div className="glass rounded-xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <ClipboardList className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-display font-semibold">Aucun programme</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Sélectionnez un élève depuis la page Élèves pour lui créer un programme.
        </p>
      </div>
    </div>
  );
};

export default CoachPrograms;
