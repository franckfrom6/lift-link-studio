import { User } from "lucide-react";

const StudentProfile = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Mon Profil</h1>
      </div>

      <div className="glass rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">Élève</h2>
            <p className="text-sm text-muted-foreground">Athlète</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Objectif</p>
            <p className="font-medium text-sm mt-1">Non défini</p>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Niveau</p>
            <p className="font-medium text-sm mt-1">Non défini</p>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Poids</p>
            <p className="font-medium text-sm mt-1">Non défini</p>
          </div>
          <div className="bg-surface rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Taille</p>
            <p className="font-medium text-sm mt-1">Non défini</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
