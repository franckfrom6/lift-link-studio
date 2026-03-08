import { useState } from "react";
import { Dumbbell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExercises } from "@/hooks/useExercises";
import { MUSCLE_GROUPS } from "@/types/coach";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getExerciseName, getMuscleGroupLabel, getEquipmentLabel } from "@/lib/exercise-utils";

const CoachExercises = () => {
  const { exercises, loading } = useExercises();
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const { t } = useTranslation('exercises');

  const filtered = exercises.filter((ex) => {
    const name = getExerciseName(ex);
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !selectedMuscle || ex.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, ex) => {
    if (!acc[ex.muscle_group]) acc[ex.muscle_group] = [];
    acc[ex.muscle_group].push(ex);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t('exercise_library')}</h1>
        <p className="text-muted-foreground text-sm">{t('exercises_available', { count: exercises.length })}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Input placeholder={t('search_exercise')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-surface" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedMuscle(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !selectedMuscle ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}>
          {t('all')}
        </button>
        {MUSCLE_GROUPS.map((mg) => (
          <button key={mg} onClick={() => setSelectedMuscle(mg === selectedMuscle ? null : mg)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedMuscle === mg ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>
            {getMuscleGroupLabel(mg)}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([muscle, exs]) => (
          <div key={muscle}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-3">{getMuscleGroupLabel(muscle)}</h3>
            <div className="grid gap-2">
              {exs.map((ex) => (
                <div key={ex.id} className="glass p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{getExerciseName(ex)}</p>
                    <p className="text-xs text-muted-foreground truncate">{ex.description}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{ex.type === "compound" ? t('compound') : t('isolation')}</Badge>
                    <Badge variant="outline" className="text-[10px]">{getEquipmentLabel(ex.equipment)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="glass p-12 text-center space-y-3">
            <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
            <p className="text-muted-foreground">{t('no_exercise_found')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachExercises;
