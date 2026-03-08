import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Camera, Utensils } from "lucide-react";
import MacroDonut from "./MacroDonut";

export interface MealLogData {
  id?: string;
  meal_type: string;
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  photo_url?: string;
  notes?: string;
}

interface MealCardProps {
  meal: MealLogData;
  onEdit: () => void;
  onDelete: () => void;
}

const MEAL_TYPES = [
  { id: "breakfast", label: "Petit-déjeuner", icon: "🌅", time: "7-9h" },
  { id: "lunch", label: "Déjeuner", icon: "☀️", time: "12-14h" },
  { id: "snack", label: "Collation", icon: "🍎", time: "" },
  { id: "dinner", label: "Dîner", icon: "🌙", time: "19-21h" },
  { id: "pre_workout", label: "Pré-training", icon: "⚡", time: "" },
  { id: "post_workout", label: "Post-training", icon: "💪", time: "" },
];

const MealCard = ({ meal, onEdit, onDelete }: MealCardProps) => {
  const mealType = MEAL_TYPES.find(m => m.id === meal.meal_type);
  const hasMacros = meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g;

  return (
    <div className="glass p-3 space-y-2" onClick={onEdit}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{mealType?.icon || "🍽"}</span>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{mealType?.label || meal.meal_type}</p>
            <p className="text-sm">{meal.description || "—"}</p>
          </div>
        </div>
        {hasMacros && (
          <div className="text-right text-[10px]">
            {meal.calories && <p className="font-bold">{meal.calories} kcal</p>}
            <div className="flex gap-1.5 text-muted-foreground">
              {meal.protein_g && <span style={{ color: "hsl(217 91% 60%)" }}>P:{meal.protein_g}g</span>}
              {meal.carbs_g && <span style={{ color: "hsl(45 93% 47%)" }}>G:{meal.carbs_g}g</span>}
              {meal.fat_g && <span style={{ color: "hsl(0 72% 51%)" }}>L:{meal.fat_g}g</span>}
            </div>
          </div>
        )}
      </div>
      {meal.photo_url && (
        <img src={meal.photo_url} alt="Repas" className="w-full h-32 object-cover rounded-lg" />
      )}
    </div>
  );
};

interface MealFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MealLogData) => void;
  initialData?: MealLogData | null;
}

const MealFormSheet = ({ open, onClose, onSubmit, initialData }: MealFormSheetProps) => {
  const [mealType, setMealType] = useState(initialData?.meal_type || "lunch");
  const [description, setDescription] = useState(initialData?.description || "");
  const [calories, setCalories] = useState(initialData?.calories?.toString() || "");
  const [protein, setProtein] = useState(initialData?.protein_g?.toString() || "");
  const [carbs, setCarbs] = useState(initialData?.carbs_g?.toString() || "");
  const [fat, setFat] = useState(initialData?.fat_g?.toString() || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = () => {
    onSubmit({
      id: initialData?.id,
      meal_type: mealType,
      description,
      calories: calories ? parseInt(calories) : undefined,
      protein_g: protein ? parseInt(protein) : undefined,
      carbs_g: carbs ? parseInt(carbs) : undefined,
      fat_g: fat ? parseInt(fat) : undefined,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[90vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-base">{initialData ? "Modifier le repas" : "Ajouter un repas"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-4">
          {/* Meal type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type de repas</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {MEAL_TYPES.map(mt => (
                <button key={mt.id} onClick={() => setMealType(mt.id)}
                  className={cn("py-2 rounded-lg text-xs font-medium border transition-all text-center",
                    mealType === mt.id ? "border-primary bg-accent text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                  )}>
                  <span className="text-base block">{mt.icon}</span>
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qu'as-tu mangé ?</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Poulet grillé, riz basmati, haricots verts"
              rows={2}
            />
          </div>

          {/* Macros (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Macros (optionnel)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Calories</label>
                <Input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="kcal" className="h-9 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px]" style={{ color: "hsl(217 91% 60%)" }}>Prot. (g)</label>
                <Input type="number" value={protein} onChange={e => setProtein(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px]" style={{ color: "hsl(45 93% 47%)" }}>Gluc. (g)</label>
                <Input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px]" style={{ color: "hsl(0 72% 51%)" }}>Lip. (g)</label>
                <Input type="number" value={fat} onChange={e => setFat(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optionnel)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Repas un peu léger" className="h-10" />
          </div>

          <Button className="w-full h-12 font-semibold" onClick={handleSubmit}>
            {initialData ? "Modifier" : "Ajouter le repas"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

interface DailyNutritionLogProps {
  date: Date;
  meals: MealLogData[];
  onAddMeal: (data: MealLogData) => void;
  onEditMeal: (data: MealLogData) => void;
  onDeleteMeal: (id: string) => void;
  targets?: { calorie_target: number; protein_g: number; carbs_g: number; fat_g: number } | null;
}

const DailyNutritionLog = ({ date, meals, onAddMeal, onEditMeal, onDeleteMeal, targets }: DailyNutritionLogProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MealLogData | null>(null);

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein_g || 0),
      carbs: acc.carbs + (m.carbs_g || 0),
      fat: acc.fat + (m.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getProgressStatus = (current: number, target: number) => {
    if (target === 0) return "neutral";
    const ratio = current / target;
    if (ratio >= 0.9 && ratio <= 1.1) return "success";
    if (ratio >= 0.75 && ratio <= 1.25) return "warning";
    return "danger";
  };

  const ProgressBar = ({ current, target, color }: { current: number; target: number; color: string }) => {
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return (
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Daily summary */}
      {targets && (
        <div className="glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <span className={cn("text-xs font-bold",
              getProgressStatus(totals.calories, targets.calorie_target) === "success" ? "text-success" :
              getProgressStatus(totals.calories, targets.calorie_target) === "warning" ? "text-warning" : "text-muted-foreground"
            )}>
              {totals.calories} / {targets.calorie_target} kcal
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span style={{ color: "hsl(217 91% 60%)" }}>Protéines</span>
                <span className="font-bold">{totals.protein}/{targets.protein_g}g</span>
              </div>
              <ProgressBar current={totals.protein} target={targets.protein_g} color="hsl(217 91% 60%)" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span style={{ color: "hsl(45 93% 47%)" }}>Glucides</span>
                <span className="font-bold">{totals.carbs}/{targets.carbs_g}g</span>
              </div>
              <ProgressBar current={totals.carbs} target={targets.carbs_g} color="hsl(45 93% 47%)" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span style={{ color: "hsl(0 72% 51%)" }}>Lipides</span>
                <span className="font-bold">{totals.fat}/{targets.fat_g}g</span>
              </div>
              <ProgressBar current={totals.fat} target={targets.fat_g} color="hsl(0 72% 51%)" />
            </div>
          </div>
        </div>
      )}

      {/* Meals list */}
      <div className="space-y-2">
        {MEAL_TYPES.map(mt => {
          const mealEntries = meals.filter(m => m.meal_type === mt.id);
          if (mealEntries.length === 0) return null;
          return mealEntries.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={() => { setEditing(meal); setFormOpen(true); }}
              onDelete={() => meal.id && onDeleteMeal(meal.id)}
            />
          ));
        })}

        {meals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Utensils className="w-6 h-6 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
            Aucun repas enregistré
          </div>
        )}
      </div>

      {/* Add button */}
      <Button variant="outline" className="w-full" onClick={() => { setEditing(null); setFormOpen(true); }}>
        <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
        Ajouter un repas
      </Button>

      {/* Form sheet */}
      <MealFormSheet
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={(data) => {
          if (data.id) onEditMeal(data);
          else onAddMeal(data);
        }}
        initialData={editing}
      />
    </div>
  );
};

export default DailyNutritionLog;
