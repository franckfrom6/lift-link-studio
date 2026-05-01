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
  useMealPlanRealtime,
  type MealFoodRow,
  type MealRow,
} from "@/hooks/useMealPlan";
import { computeEntryMacros, sumMacros } from "@/lib/nutrition-macros";
import MealCard from "./MealCard";
import SortableMealCard from "./SortableMealCard";
import SortableFoodChip from "./SortableFoodChip";
import FoodPickerSheet from "./FoodPickerSheet";
import FoodEditSheet from "./FoodEditSheet";
import SubstituteFoodSheet from "./SubstituteFoodSheet";
import OfflineQueueBadge from "./OfflineQueueBadge";
import { useReorderMeals, useReorderMealFoods } from "@/hooks/useReorderMeals";
import { useActivityLogger } from "@/hooks/useActivityLog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

interface MealPlanEditorProps {
  studentId: string;
  /** True for the coach view (shows athlete_can_edit toggle). */
  asCoach?: boolean;
  /** True for the athlete view: hides athlete_can_edit toggle and locks daily targets. */
  asAthlete?: boolean;
  /** When true, hide all edit affordances (chips, +meal, etc.). */
  readOnly?: boolean;
}

/**
 * Orchestrates the full meal-plan editing experience:
 * sticky daily totals, list of MealCards, add/duplicate/delete meals,
 * picker + editor sheets, undoable chip removal.
 */
const MealPlanEditor = ({ studentId, asCoach = true, asAthlete = false, readOnly = false }: MealPlanEditorProps) => {
  const { data: plan, isLoading } = useMealPlan(studentId);
  // Live multi-tab updates: any remote change triggers a discreet toast + refetch.
  useMealPlanRealtime(studentId, () => toast("Plan mis à jour", { duration: 2000 }));
  const updatePlan = useUpdatePlan(studentId);
  const addMeal = useAddMeal(studentId);
  const updateMeal = useUpdateMeal(studentId);
  const deleteMeal = useDeleteMeal(studentId);
  const duplicateMeal = useDuplicateMeal(studentId);
  const addMealFood = useAddMealFood(studentId);
  const updateMealFood = useUpdateMealFood(studentId);
  const deleteMealFood = useDeleteMealFood(studentId);
  const reorderMeals = useReorderMeals(studentId);
  const reorderMealFoods = useReorderMealFoods(studentId);

  // Activity log: who did what on this plan.
  const log = useActivityLogger(plan?.id ?? null, asAthlete ? "athlete" : "coach");

  // DnD sensors: pointer for mouse, touch with 250ms delay (so taps & long-press still work).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
  const [substituteEntry, setSubstituteEntry] = useState<MealFoodRow | null>(null);
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
    const name = defaults[Math.min(orderIndex, defaults.length - 1)];
    addMeal.mutate(
      { planId: plan.id, name, orderIndex },
      { onSuccess: () => log({ actionType: "create_meal", entityType: "meal", after: { name } }) }
    );
  };

  /** Optimistic delete with 5-second undo toast. */
  const handleDeleteFood = (entry: MealFoodRow) => {
    const snapshot = entry;
    deleteMealFood.mutate(
      { mealFoodId: entry.id },
      {
        onSuccess: () => log({
          actionType: "remove_food",
          entityType: "meal_food",
          entityId: entry.id,
          before: { food_name: entry.food?.name_fr, quantity: entry.quantity, unit: entry.unit },
        }),
      }
    );
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
    deleteMeal.mutate(
      { mealId },
      {
        onSuccess: () => log({
          actionType: "delete_meal",
          entityType: "meal",
          entityId: mealId,
          before: { name: meal.name, food_count: meal.meal_foods.length },
        }),
      }
    );
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

  /** DnD: meals reorder. We compute the new order from arrayMove and persist. */
  const handleMealDragEnd = (e: DragEndEvent) => {
    if (!plan) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = plan.meals.findIndex((m) => m.id === active.id);
    const newIndex = plan.meals.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(plan.meals, oldIndex, newIndex);
    const updates = reordered.map((m, i) => ({ id: m.id, order_index: i }));
    reorderMeals.mutate(updates, {
      onSuccess: () => log({ actionType: "reorder_meal", entityType: "plan", after: { count: updates.length } }),
    });
  };

  /** DnD: chips reorder within a meal. */
  const handleChipDragEnd = (meal: MealRow) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = meal.meal_foods.findIndex((mf) => mf.id === active.id);
    const newIndex = meal.meal_foods.findIndex((mf) => mf.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(meal.meal_foods, oldIndex, newIndex);
    const updates = reordered.map((mf, i) => ({ id: mf.id, order_index: i }));
    reorderMealFoods.mutate(updates, {
      onSuccess: () => log({
        actionType: "reorder_food", entityType: "meal", entityId: meal.id,
        after: { count: updates.length },
      }),
    });
  };

  return (
    <div className="space-y-3">
      {/* Header: editable name + athlete toggle */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <div className="flex items-start gap-2">
          <Input
            value={planName}
            onChange={(e) => { setPlanName(e.target.value); if (!asAthlete) queuePlanSave({ name: e.target.value }); }}
            disabled={asAthlete || readOnly}
            className="h-9 font-bold text-base flex-1"
            placeholder="Nom du plan"
          />
          {!asAthlete && !readOnly && (
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
          )}
        </div>

        {asCoach && !asAthlete && (
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
        <div className="flex items-center justify-end mb-1.5">
          <OfflineQueueBadge />
        </div>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMealDragEnd}>
          <SortableContext items={plan.meals.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {plan.meals.map((meal) => (
                <SortableMealCard
                  key={meal.id}
                  meal={meal}
                  readOnly={readOnly}
                  onRename={(name, time) =>
                    updateMeal.mutate(
                      { mealId: meal.id, patch: { name, time_target: time } as any },
                      { onSuccess: () => log({ actionType: "rename_meal", entityType: "meal", entityId: meal.id, before: { name: meal.name }, after: { name } }) }
                    )
                  }
                  onDelete={() => handleDeleteMeal(meal.id)}
                  onDuplicate={() =>
                    duplicateMeal.mutate(
                      { meal, newOrderIndex: plan.meals.length },
                      { onSuccess: () => log({ actionType: "duplicate_meal", entityType: "meal", entityId: meal.id, after: { name: meal.name } }) }
                    )
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
                  onSubstituteFood={(mealFoodId) => {
                    const entry = meal.meal_foods.find((mf) => mf.id === mealFoodId);
                    if (entry) setSubstituteEntry(entry);
                  }}
                  childrenOverride={
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleChipDragEnd(meal)}
                    >
                      <SortableContext items={meal.meal_foods.map((mf) => mf.id)} strategy={rectSortingStrategy}>
                        <div className="flex flex-wrap gap-1.5">
                          {meal.meal_foods.map((mf) => (
                            <SortableFoodChip
                              key={mf.id}
                              entry={mf}
                              readOnly={readOnly}
                              onTap={() => setEditEntry(mf)}
                              onRemove={() => handleDeleteFood(mf)}
                              onLongPress={() => setSubstituteEntry(mf)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!readOnly && (
        <Button onClick={handleAddMeal} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Ajouter un repas
        </Button>
      )}

      {/* Sheets */}
      <FoodPickerSheet
        open={!!pickerFor}
        onClose={() => setPickerFor(null)}
        onPick={({ foodId, quantity, unit, notes }) => {
          if (!pickerFor) return;
          addMealFood.mutate(
            {
              mealId: pickerFor.mealId,
              foodId, quantity, unit,
              orderIndex: pickerFor.orderIndex,
              notes,
            },
            { onSuccess: () => log({ actionType: "add_food", entityType: "meal_food", after: { quantity, unit } }) }
          );
        }}
      />

      <FoodEditSheet
        open={!!editEntry}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSave={(patch) => {
          if (!editEntry) return;
          updateMealFood.mutate(
            { mealFoodId: editEntry.id, patch },
            { onSuccess: () => log({
                actionType: "edit_food", entityType: "meal_food", entityId: editEntry.id,
                before: { quantity: editEntry.quantity, unit: editEntry.unit },
                after: patch,
                ...(editEntry.food ? {} : {}),
              }) }
          );
        }}
        onDelete={() => editEntry && handleDeleteFood(editEntry)}
        onReplace={() => {
          if (!editEntry) return;
          // Open the substitute sheet (smart suggestions) instead of generic picker.
          setSubstituteEntry(editEntry);
        }}
      />

      <SubstituteFoodSheet
        open={!!substituteEntry}
        entry={substituteEntry}
        onClose={() => setSubstituteEntry(null)}
        onSubstitute={(food) => {
          if (!substituteEntry) return;
          // Same quantity; if unit changed in the new food's default, keep current unit unless mismatched.
          updateMealFood.mutate({
            mealFoodId: substituteEntry.id,
            patch: { } as any, // no-op, we replace via insert+delete below
          });
          // True swap: delete old chip, insert new with same qty/unit/order.
          deleteMealFood.mutate({ mealFoodId: substituteEntry.id });
          addMealFood.mutate({
            mealId: substituteEntry.meal_id,
            foodId: food.id,
            quantity: substituteEntry.quantity,
            unit: substituteEntry.unit,
            orderIndex: substituteEntry.order_index,
            notes: substituteEntry.notes,
          });
          toast.success("Aliment remplacé");
        }}
        onOpenManualPicker={() => {
          if (!substituteEntry) return;
          setPickerFor({ mealId: substituteEntry.meal_id, orderIndex: substituteEntry.order_index });
          deleteMealFood.mutate({ mealFoodId: substituteEntry.id });
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