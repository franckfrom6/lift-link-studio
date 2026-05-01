import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Repeat, Trash2 } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ALL_UNITS, computeEntryMacros, unitLabel, type FoodUnit,
} from "@/lib/nutrition-macros";
import { cn } from "@/lib/utils";
import type { MealFoodRow } from "@/hooks/useMealPlan";

interface FoodEditSheetProps {
  open: boolean;
  entry: MealFoodRow | null;
  onClose: () => void;
  onSave: (patch: { quantity: number; unit: FoodUnit; notes: string | null }) => void;
  onDelete: () => void;
  onReplace: () => void;
}

/** Edit quantity / unit / notes of an existing chip; offers Replace and Delete. */
const FoodEditSheet = ({ open, entry, onClose, onSave, onDelete, onReplace }: FoodEditSheetProps) => {
  const { i18n } = useTranslation();
  const isFr = (i18n.language || "fr").startsWith("fr");

  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState<FoodUnit>("g");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (entry) {
      setQuantity(String(entry.quantity ?? 0));
      setUnit(entry.unit);
      setNotes(entry.notes ?? "");
    }
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const food = entry?.food ?? null;
  const qty = Number(quantity) || 0;
  const macros = useMemo(
    () => (food ? computeEntryMacros(food, qty, unit) : null),
    [food, qty, unit]
  );

  const handleSave = () => {
    if (!entry || qty <= 0) return;
    onSave({ quantity: qty, unit, notes: notes.trim() || null });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[80dvh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <SheetTitle className="text-base truncate">
            {food ? (isFr ? food.name_fr : food.name_en) : "Aliment"}
          </SheetTitle>
        </SheetHeader>

        {!entry || !food ? (
          <div className="flex-1" />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Quantité</label>
                  <Input
                    type="number" inputMode="decimal" min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-10 mt-1 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Unité</label>
                  <Select value={unit} onValueChange={(v) => setUnit(v as FoodUnit)}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                <Textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionnel" className="mt-1 min-h-[60px]"
                />
              </div>

              {macros && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 grid grid-cols-4 gap-2 text-center">
                  <Mac label="kcal" value={macros.kcal} bold />
                  <Mac label="P" value={macros.protein} />
                  <Mac label="G" value={macros.carbs} />
                  <Mac label="L" value={macros.fat} />
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => { onClose(); onReplace(); }}>
                <Repeat className="w-4 h-4 mr-2" />
                Remplacer cet aliment
              </Button>

              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { onClose(); onDelete(); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>

            <div className="border-t px-4 py-3 pb-safe-nav flex gap-2">
              <Button variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
              <Button onClick={handleSave} className="flex-1" disabled={qty <= 0}>
                Enregistrer
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Mac = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
  <div>
    <p className={cn("tabular-nums leading-none", bold ? "text-base font-bold" : "text-sm font-semibold")}>
      {Math.round(value)}
    </p>
    <p className="text-[10px] text-muted-subtle mt-0.5">{label}</p>
  </div>
);

export default FoodEditSheet;