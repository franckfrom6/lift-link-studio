import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Search, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import type { FoodRow } from "@/hooks/useMealPlan";
import {
  ALL_UNITS, CATEGORY_CHIP_CLASSES, CATEGORY_LABELS,
  computeEntryMacros, unitLabel,
  type FoodCategory, type FoodUnit,
} from "@/lib/nutrition-macros";
import { cn } from "@/lib/utils";

interface FoodPickerSheetProps {
  open: boolean;
  onClose: () => void;
  onPick: (input: { foodId: string; quantity: number; unit: FoodUnit; notes: string | null }) => void;
}

type Step = "search" | "configure" | "create";

/** Search for a food, then configure quantity/unit/notes before adding to a meal. */
const FoodPickerSheet = ({ open, onClose, onPick }: FoodPickerSheetProps) => {
  const { i18n } = useTranslation();
  const isFr = (i18n.language || "fr").startsWith("fr");
  const [step, setStep] = useState<Step>("search");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [rawQuery, setRawQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [picked, setPicked] = useState<FoodRow | null>(null);

  // Debounce 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(rawQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("search"); setRawQuery(""); setDebounced(""); setPicked(null); setTab("all");
    }
  }, [open]);

  const minLen = debounced.length >= 2;
  const { data: results = [], isLoading } = useFoodSearch({
    query: minLen ? debounced : "",
    mineOnly: tab === "mine",
    enabled: open && (minLen || tab === "mine"),
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[88dvh] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            {step !== "search" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2"
                onClick={() => setStep("search")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <SheetTitle className="text-base">
              {step === "search" && "Ajouter un aliment"}
              {step === "configure" && (picked ? (isFr ? picked.name_fr : picked.name_en) : "Configurer")}
              {step === "create" && "Nouvel aliment perso"}
            </SheetTitle>
          </div>
        </SheetHeader>

        {step === "search" && (
          <SearchStep
            isFr={isFr}
            tab={tab} setTab={setTab}
            rawQuery={rawQuery} setRawQuery={setRawQuery}
            results={results} isLoading={isLoading} minLen={minLen}
            onPick={(f) => { setPicked(f); setStep("configure"); }}
            onCreateClick={() => setStep("create")}
          />
        )}

        {step === "configure" && picked && (
          <ConfigureStep
            isFr={isFr}
            food={picked}
            onCancel={() => setStep("search")}
            onConfirm={(payload) => { onPick({ foodId: picked.id, ...payload }); onClose(); }}
          />
        )}

        {step === "create" && (
          <CreateStep
            isFr={isFr}
            onCancel={() => setStep("search")}
            onCreated={(food) => { setPicked(food); setStep("configure"); }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

// ---------- Step 1: Search ----------
const SearchStep = ({
  isFr, tab, setTab, rawQuery, setRawQuery, results, isLoading, minLen, onPick, onCreateClick,
}: {
  isFr: boolean;
  tab: "all" | "mine"; setTab: (t: "all" | "mine") => void;
  rawQuery: string; setRawQuery: (s: string) => void;
  results: FoodRow[]; isLoading: boolean; minLen: boolean;
  onPick: (f: FoodRow) => void;
  onCreateClick: () => void;
}) => (
  <>
    <div className="px-4 pt-3 pb-2 space-y-3 border-b">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          autoFocus
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          placeholder="Rechercher (FR ou EN)…"
          className="pl-9 h-10"
        />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "mine")}>
        <TabsList className="grid grid-cols-2 w-full h-9">
          <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
          <TabsTrigger value="mine" className="text-xs">Mes aliments</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <div className="flex-1 overflow-y-auto px-2 py-2">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : !minLen && tab === "all" ? (
        <p className="text-center text-xs text-muted-subtle py-8 px-4">
          Tapez au moins 2 caractères pour chercher.
        </p>
      ) : results.length === 0 ? (
        <p className="text-center text-xs text-muted-subtle py-8 px-4">
          Aucun aliment trouvé. Créez-en un personnalisé ci-dessous.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {results.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onPick(f)}
                className="w-full px-3 py-2.5 text-left hover:bg-muted/50 active:bg-muted rounded-md flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{isFr ? f.name_fr : f.name_en}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0 rounded-full border text-[10px] font-semibold",
                      CATEGORY_CHIP_CLASSES[f.category as FoodCategory],
                    )}>
                      {CATEGORY_LABELS[f.category as FoodCategory]}
                    </span>
                    {!f.is_system && (
                      <span className="text-[10px] font-semibold text-primary">Perso</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums">{Math.round(f.kcal_per_100g)}</p>
                  <p className="text-[10px] text-muted-subtle">kcal/100{f.default_unit === "ml" ? "ml" : "g"}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="border-t px-4 py-3 pb-safe-nav">
      <Button variant="outline" className="w-full" onClick={onCreateClick}>
        <Plus className="w-4 h-4 mr-2" />
        Créer un aliment personnalisé
      </Button>
    </div>
  </>
);

// ---------- Step 2: Configure (qty / unit / notes) ----------
const ConfigureStep = ({
  isFr, food, onCancel, onConfirm,
}: {
  isFr: boolean;
  food: FoodRow;
  onCancel: () => void;
  onConfirm: (payload: { quantity: number; unit: FoodUnit; notes: string | null }) => void;
}) => {
  const [quantity, setQuantity] = useState<string>("100");
  const [unit, setUnit] = useState<FoodUnit>(food.default_unit);
  const [notes, setNotes] = useState("");

  const qty = Number(quantity) || 0;
  const macros = useMemo(() => computeEntryMacros(food, qty, unit), [food, qty, unit]);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-sm font-semibold">{isFr ? food.name_fr : food.name_en}</p>
          <p className="text-[11px] text-muted-subtle mt-0.5">
            {Math.round(food.kcal_per_100g)} kcal · P {food.protein_per_100g}g · G {food.carbs_per_100g}g · L {food.fat_per_100g}g <span className="opacity-60">/100{food.default_unit === "ml" ? "ml" : "g"}</span>
          </p>
        </div>

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
          <label className="text-xs font-semibold text-muted-foreground">Notes (optionnel)</label>
          <Textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: cuit, à la vapeur…" className="mt-1 min-h-[60px]"
          />
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 grid grid-cols-4 gap-2 text-center">
          <Macro label="kcal" value={macros.kcal} bold />
          <Macro label="P" value={macros.protein} />
          <Macro label="G" value={macros.carbs} />
          <Macro label="L" value={macros.fat} />
        </div>
      </div>

      <div className="border-t px-4 py-3 pb-safe-nav flex gap-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1">Retour</Button>
        <Button
          className="flex-1"
          disabled={qty <= 0}
          onClick={() => onConfirm({ quantity: qty, unit, notes: notes.trim() || null })}
        >
          Ajouter au repas
        </Button>
      </div>
    </>
  );
};

const Macro = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
  <div>
    <p className={cn("tabular-nums leading-none", bold ? "text-base font-bold" : "text-sm font-semibold")}>
      {Math.round(value)}
    </p>
    <p className="text-[10px] text-muted-subtle mt-0.5">{label}</p>
  </div>
);

// ---------- Step 3: Create custom food ----------
const CreateStep = ({
  isFr: _isFr, onCancel, onCreated,
}: {
  isFr: boolean;
  onCancel: () => void;
  onCreated: (food: FoodRow) => void;
}) => {
  const [nameFr, setNameFr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [category, setCategory] = useState<FoodCategory>("other");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [defaultUnit, setDefaultUnit] = useState<FoodUnit>("g");
  const [saving, setSaving] = useState(false);

  const valid = nameFr.trim().length > 0 && nameEn.trim().length > 0 && Number(kcal) >= 0;

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("foods")
        .insert({
          name_fr: nameFr.trim(),
          name_en: nameEn.trim(),
          category,
          kcal_per_100g: Number(kcal) || 0,
          protein_per_100g: Number(protein) || 0,
          carbs_per_100g: Number(carbs) || 0,
          fat_per_100g: Number(fat) || 0,
          default_unit: defaultUnit,
          is_system: false,
          created_by: u.user.id,
        })
        .select(
          "id, name_fr, name_en, category, kcal_per_100g, protein_per_100g, " +
          "carbs_per_100g, fat_per_100g, fiber_per_100g, default_unit, is_system, created_by"
        )
        .single();
      if (error) throw error;
      toast.success("Aliment créé");
      onCreated(data as unknown as FoodRow);
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <Field label="Nom (FR)"><Input value={nameFr} onChange={(e) => setNameFr(e.target.value)} placeholder="Ex: Quinoa cuit" /></Field>
        <Field label="Nom (EN)"><Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Ex: Cooked quinoa" /></Field>
        <Field label="Catégorie">
          <Select value={category} onValueChange={(v) => setCategory(v as FoodCategory)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Unité par défaut">
          <Select value={defaultUnit} onValueChange={(v) => setDefaultUnit(v as FoodUnit)}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_UNITS.map((u) => <SelectItem key={u} value={u}>{unitLabel(u)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-subtle pt-2">
          Macros pour 100 {defaultUnit === "ml" ? "ml" : "g"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="kcal"><Input type="number" inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} /></Field>
          <Field label="Protéines (g)"><Input type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} /></Field>
          <Field label="Glucides (g)"><Input type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></Field>
          <Field label="Lipides (g)"><Input type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} /></Field>
        </div>
      </div>
      <div className="border-t px-4 py-3 pb-safe-nav flex gap-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button className="flex-1" onClick={save} disabled={!valid || saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
        </Button>
      </div>
    </>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

export default FoodPickerSheet;