import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import FoodChip from "./FoodChip";
import { computeEntryMacros, sumMacros } from "@/lib/nutrition-macros";
import type { MealRow } from "@/hooks/useMealPlan";

interface MealCardProps {
  meal: MealRow;
  readOnly?: boolean;
  onRename?: (name: string, time: string | null) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddFood?: () => void;
  onRemoveFood?: (mealFoodId: string) => void;
  onEditFood?: (mealFoodId: string) => void;
  /** Long-press on a chip → request substitution */
  onSubstituteFood?: (mealFoodId: string) => void;
  /**
   * Optional render override for the chips area. When provided, the
   * default chip list is replaced (used to inject a sortable context).
   */
  childrenOverride?: React.ReactNode;
}

const MealCard = ({
  meal, readOnly,
  onRename, onDelete, onDuplicate, onAddFood, onRemoveFood, onEditFood, onSubstituteFood,
  childrenOverride,
}: MealCardProps) => {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(meal.name);
  const [time, setTime] = useState(meal.time_target ?? "");

  const totals = sumMacros(
    meal.meal_foods
      .filter((mf) => mf.food)
      .map((mf) => computeEntryMacros(mf.food!, mf.quantity, mf.unit))
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate">{meal.name}</h3>
          {meal.time_target && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-subtle tabular-nums">
              {meal.time_target}
            </p>
          )}
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-base font-bold tabular-nums text-foreground leading-none">
            {Math.round(totals.kcal)}
          </span>
          <span className="text-[10px] font-medium text-muted-subtle">kcal</span>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />Renommer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-3.5 h-3.5 mr-2" />Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Macro row */}
      <div className="flex items-center gap-3 text-[10px] font-semibold tabular-nums text-muted-foreground">
        <span>P {Math.round(totals.protein)}g</span>
        <span>G {Math.round(totals.carbs)}g</span>
        <span>L {Math.round(totals.fat)}g</span>
      </div>

      {/* Chips */}
      {childrenOverride ? (
        meal.meal_foods.length > 0 ? (
          childrenOverride
        ) : (
          <p className="text-xs text-muted-subtle italic">Aucun aliment</p>
        )
      ) : meal.meal_foods.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {meal.meal_foods.map((mf) => (
            <FoodChip
              key={mf.id}
              entry={mf}
              readOnly={readOnly}
              onTap={() => onEditFood?.(mf.id)}
              onRemove={() => onRemoveFood?.(mf.id)}
              onLongPress={onSubstituteFood ? () => onSubstituteFood(mf.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-subtle italic">Aucun aliment</p>
      )}

      {/* Add food */}
      {!readOnly && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddFood}
          className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un aliment
        </Button>
      )}

      {/* Rename dialog */}
      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renommer le repas</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du repas" />
            <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="Heure cible (ex: 08:00)" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onRename?.(name.trim() || meal.name, time.trim() || null); setRenameOpen(false); }}>
              Enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce repas ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirera le repas et tous ses aliments du plan. Irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onDelete?.(); setDeleteOpen(false); }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MealCard;