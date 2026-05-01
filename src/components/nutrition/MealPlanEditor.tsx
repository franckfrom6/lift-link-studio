import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Pencil, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useMealPlan, useUpdatePlan, useAddMeal, useUpdateMeal, useDeleteMeal,
  useDuplicateMeal, useAddMealFood, useUpdateMealFood, useDeleteMealFood,
  type MealFoodRow,
} from "@/hooks/useMealPlan";
import { computeEntryMacros, sumMacros } from "@/lib/nutrition-macros";
import MealCard from "./MealCard";
import FoodPickerSheet from "./FoodPickerSheet";
import FoodEditSheet from "./FoodEditSheet";

interface MealPlanEditorProps {
  studentId: string;
  /** True for the coach view (shows athlete_can_edit toggle). */
  asCoach?: boolean;
}

/**
 * Orchestrates the full meal-plan editing experience:
 * sticky daily totals, list of MealCards, add/duplicate/delete meals,
 * picker + editor sheets, undoable chip removal.
 */
const MealPlanEditor = ({ studentId, asCoach = true }: MealPlanEditorProps) => {
  const { data: plan, isLoading } = useMealPlan(studentId);
  const updatePlan = useUpdatePlan(studentId);
  const addMeal = useAddMeal(studentId);
  const updateMeal = useUpdateMeal(studentId);
  const deleteMeal = useDeleteMeal(studentId);
  const duplicateMeal = useDuplicateMeal(studentId);
  const addMealFood = useAddMealFood(studentId);
  const updateMealFood = useUpdateMealFood(studentId);
  const deleteMealFood = useDeleteMealFood(studentId);

  // ----- Editable plan-level fields (debounced auto-save) -----
  const [planName, setPlanName] = useState<string>("");
  const [targets, setTargets] = useState({
    kcal: "", protein: "", carbs: "", fat: "",
  });
  const [athleteCanEdit, setAthleteCanEdit] = useState(false);
  const hydratedFor = useRef<string | null>(null);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  /**
   * Pending patch buffer. Accumulates field changes within the debounce
   * window so multiple edits flush as a SINGLE update, not one per field.
   */
  const pendingPatch = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!plan || hydratedFor.current === plan.id) return;
    hydratedFor.current = plan.id;
    setPlanName(plan.name);
    setTargets({
      kcal: plan.target_kcal?.toString() ?? "",
      protein: plan.target_protein_g?.toString() ?? "",
      carbs: plan.target_carbs_g?.toString() ?? "",
      fat: plan.target_fat_g?.toString() ?? "",
    });
    setAthleteCanEdit(plan.athlete_can_edit);
  }, [plan]);

  /**
   * Debounced 1 s save: merges every queued patch into a single buffer,
   * then flushes once when the user stops typing.
   */
  const queuePlanSave = (patch: Record<string, any>) => {
    if (!plan) return;
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const flush = pendingPatch.current;
      pendingPatch.current = {};
      saveTimer.current = null;
      if (Object.keys(flush).length === 0) return;
      updatePlan.mutate({ planId: plan.id, patch: flush as any });
    }, 1000);
  };

  // ----- Sheets state -----
  const [pickerFor, setPickerFor] = useState<{ mealId: string; orderIndex: number } | null>(null);
  const [editEntry, setEditEntry] = useState<MealFoodRow | null>(null);
  const [editTargetsOpen, setEditTargetsOpen] = useState(false);

  // ----- Daily totals -----
  const totals = useMemo(() => {
    if (!plan) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    return sumMacros(
      plan.meals.flatMap((m) =>
        m.meal_foods
          .filter((mf) => mf.food)
          .map((mf) => computeEntryMacros(mf.food!, mf.quantity, mf.unit))
      )
    );
  }, [plan]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return null; // Empty state is handled by the page wrapper.
  }

  // ----- Handlers -----
  const handleAddMeal = () => {
    const orderIndex = plan.meals.length;
    const defaults = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner", "Repas"];
    addMeal.mutate({
      planId: plan.id,
      name: defaults[Math.min(orderIndex, defaults.length - 1)],
      orderIndex,
    });
  };

  /** Optimistic delete with 5-second undo toast. */
  const handleDeleteFood = (entry: MealFoodRow) => {
    const snapshot = entry;
    deleteMealFood.mutate({ mealFoodId: entry.id });
    toast("Aliment supprimé", {
      description: snapshot.food
        ? `${snapshot.food.name_fr} retiré du repas`
        : undefined,
      duration: 5000,
      action: {
        label: "Annuler",
        onClick: () => {
          addMealFood.mutate({
            mealId: snapshot.meal_id,
            foodId: snapshot.food_id,
            quantity: snapshot.quantity,
            unit: snapshot.unit,
            orderIndex: snapshot.order_index,
            notes: snapshot.notes,
          });
        },
      },
    });
  };

  /** Optimistic delete of a meal with undo (re-creates meal + chips). */
  const handleDeleteMeal = (mealId: string) => {
    const meal = plan.meals.find((m) => m.id === mealId);
    if (!meal) return;
    deleteMeal.mutate({ mealId });
    toast("Repas supprimé", {
      description: `« ${meal.name} » et ses aliments ont été retirés.`,
      duration: 5000,
      action: {
        label: "Annuler",
        onClick: () =>
          duplicateMeal.mutate({
            meal,
            newOrderIndex: meal.order_index,
            newName: meal.name,
          }),
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* Header: editable name + athlete toggle */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="flex items-start gap-2">
          <Input
            value={planName}
            onChange={(e) => { setPlanName(e.target.value); queuePlanSave({ name: e.target.value }); }}
            className="h-9 font-bold text-base flex-1"
            placeholder="Nom du plan"
          />
          <Dialog open={editTargetsOpen} onOpenChange={setEditTargetsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 shrink-0">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Cibles
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Cibles journalières</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-2">
                {(["kcal", "protein", "carbs", "fat"] as const).map((k) => (
                  <div key={k}>
                    <Label className="text-xs">
                      {k === "kcal" ? "kcal" : k === "protein" ? "Protéines (g)" : k === "carbs" ? "Glucides (g)" : "Lipides (g)"}
                    </Label>
                    <Input
                      type="number" inputMode="decimal" min={0}
                      value={targets[k]}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTargets((s) => ({ ...s, [k]: v }));
                        const num = v === "" ? null : Number(v);
                        const colMap = {
                          kcal: "target_kcal", protein: "target_protein_g",
                          carbs: "target_carbs_g", fat: "target_fat_g",
                        } as const;
                        queuePlanSave({ [colMap[k]]: num });
                      }}
                      className="h-9 mt-1 tabular-nums"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => setEditTargetsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {asCoach && (
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="athlete-edit" className="text-xs">
              Plan modifiable par l'athlète
            </Label>
            <Switch
              id="athlete-edit"
              checked={athleteCanEdit}
              onCheckedChange={(v) => {
                setAthleteCanEdit(v);
                updatePlan.mutate({ planId: plan.id, patch: { athlete_can_edit: v } as any });
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky daily totals */}
      <div className="sticky top-0 z-10 -mx-3 px-3 py-2 bg-background/95 backdrop-blur border-b border-border">
        <DailyTotals totals={totals} targets={{
          kcal: numOrNull(targets.kcal),
          protein: numOrNull(targets.protein),
          carbs: numOrNull(targets.carbs),
          fat: numOrNull(targets.fat),
        }} />
      </div>

      {/* Meals */}
      {plan.meals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
          <UtensilsCrossed className="w-7 h-7 text-muted-foreground/60 mx-auto" />
          <p className="text-sm text-muted-foreground">Aucun repas. Commencez par en ajouter un.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plan.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onRename={(name, time) =>
                updateMeal.mutate({ mealId: meal.id, patch: { name, time_target: time } as any })
              }
              onDelete={() => handleDeleteMeal(meal.id)}
              onDuplicate={() =>
                duplicateMeal.mutate({ meal, newOrderIndex: plan.meals.length })
              }
              onAddFood={() =>
                setPickerFor({ mealId: meal.id, orderIndex: meal.meal_foods.length })
              }
              onEditFood={(mealFoodId) =>
                setEditEntry(meal.meal_foods.find((mf) => mf.id === mealFoodId) ?? null)
              }
              onRemoveFood={(mealFoodId) => {
                const entry = meal.meal_foods.find((mf) => mf.id === mealFoodId);
                if (entry) handleDeleteFood(entry);
              }}
            />
          ))}
        </div>
      )}

      <Button onClick={handleAddMeal} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Ajouter un repas
      </Button>

      {/* Sheets */}
      <FoodPickerSheet
        open={!!pickerFor}
        onClose={() => setPickerFor(null)}
        onPick={({ foodId, quantity, unit, notes }) => {
          if (!pickerFor) return;
          addMealFood.mutate({
            mealId: pickerFor.mealId,
            foodId, quantity, unit,
            orderIndex: pickerFor.orderIndex,
            notes,
          });
        }}
      />

      <FoodEditSheet
        open={!!editEntry}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={(patch) => {
          if (!editEntry) return;
          updateMealFood.mutate({ mealFoodId: editEntry.id, patch });
        }}
        onDelete={() => editEntry && handleDeleteFood(editEntry)}
        onReplace={() => {
          if (!editEntry) return;
          // Open picker on same meal at the entry's index, then remove the
          // existing chip with undo so it's a true replace from the user's POV.
          setPickerFor({ mealId: editEntry.meal_id, orderIndex: editEntry.order_index });
          handleDeleteFood(editEntry);
        }}
      />
    </div>
  );
};

function numOrNull(s: string): number | null {
  if (s === "" || s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ---------- Daily totals component ----------
const DailyTotals = ({
  totals, targets,
}: {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  targets: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null };
}) => (
  <div className="grid grid-cols-4 gap-2">
    <Bar label="kcal" value={totals.kcal} target={targets.kcal} />
    <Bar label="P" value={totals.protein} target={targets.protein} unit="g" />
    <Bar label="G" value={totals.carbs} target={targets.carbs} unit="g" />
    <Bar label="L" value={totals.fat} target={targets.fat} unit="g" />
  </div>
);

const Bar = ({
  label, value, target, unit = "",
}: { label: string; value: number; target: number | null; unit?: string }) => {
  const pct = target && target > 0 ? Math.min(100, (value / target) * 100) : 0;
  // ±5% green, ±15% amber, beyond red
  let color = "bg-muted";
  if (target && target > 0) {
    const diff = Math.abs(value - target) / target;
    color = diff <= 0.05 ? "bg-emerald-500"
         : diff <= 0.15 ? "bg-amber-500"
         : "bg-rose-500";
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-subtle">
          {Math.round(value)}{unit}{target ? ` / ${Math.round(target)}${unit}` : ""}
        </span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-muted/60 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", target ? color : "bg-muted-foreground/30")}
          style={{ width: `${target ? pct : Math.min(100, value > 0 ? 50 : 0)}%` }}
        />
      </div>
    </div>
  );
};

export default MealPlanEditor;