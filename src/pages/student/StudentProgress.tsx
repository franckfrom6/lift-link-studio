import { BarChart3 } from "lucide-react";

const StudentProgress = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Progrès</h1>
        <p className="text-muted-foreground text-sm">Suivez votre évolution</p>
      </div>

      <div className="glass p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <BarChart3 className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="font-semibold">Pas encore de données</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Complétez vos premières séances pour voir vos statistiques apparaître ici.
        </p>
      </div>
    </div>
  );
};

export default StudentProgress;
