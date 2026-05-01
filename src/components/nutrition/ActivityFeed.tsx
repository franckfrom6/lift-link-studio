import { useMemo, useState } from "react";
import { Loader2, History, User, UserCog, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useActivityFeed, type ActivityLogRow, type ActionType } from "@/hooks/useActivityLog";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<ActionType, string> = {
  create_plan: "a créé le plan",
  update_plan: "a modifié le plan",
  delete_plan: "a supprimé le plan",
  create_meal: "a ajouté un repas",
  rename_meal: "a renommé un repas",
  delete_meal: "a supprimé un repas",
  duplicate_meal: "a dupliqué un repas",
  reorder_meal: "a réorganisé les repas",
  add_food: "a ajouté un aliment",
  edit_food: "a modifié un aliment",
  remove_food: "a retiré un aliment",
  substitute_food: "a remplacé un aliment",
  reorder_food: "a réorganisé des aliments",
};

const ACTION_FILTERS: { value: string; label: string; types: ActionType[] }[] = [
  { value: "all", label: "Toutes les actions", types: [] },
  { value: "meals", label: "Repas", types: ["create_meal", "rename_meal", "delete_meal", "duplicate_meal", "reorder_meal"] },
  { value: "foods", label: "Aliments", types: ["add_food", "edit_food", "remove_food", "substitute_food", "reorder_food"] },
  { value: "plan", label: "Plan", types: ["create_plan", "update_plan", "delete_plan"] },
];

interface Props {
  planId: string;
  /** When provided, used to highlight "moi" vs "autre" entries. */
  currentUserId: string | null;
}

const ActivityFeed = ({ planId, currentUserId }: Props) => {
  const [actor, setActor] = useState<"all" | "me" | "other">("all");
  const [actionGroup, setActionGroup] = useState("all");

  const types = useMemo(
    () => ACTION_FILTERS.find((f) => f.value === actionGroup)?.types ?? [],
    [actionGroup]
  );

  const { data: rows, isLoading } = useActivityFeed(planId, {
    actor,
    actionTypes: types.length ? types : undefined,
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={actor} onValueChange={(v) => setActor(v as any)}>
          <SelectTrigger className="h-9 flex-1">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les acteurs</SelectItem>
            <SelectItem value="me">Moi uniquement</SelectItem>
            <SelectItem value="other">L'athlète uniquement</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionGroup} onValueChange={setActionGroup}>
          <SelectTrigger className="h-9 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
          <History className="w-7 h-7 text-muted-foreground/60 mx-auto" />
          <p className="text-sm text-muted-foreground">Aucune activité sur ce plan pour le moment.</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r) => (
            <Entry key={r.id} row={r} currentUserId={currentUserId} />
          ))}
        </ol>
      )}
    </div>
  );
};

const Entry = ({ row, currentUserId }: { row: ActivityLogRow; currentUserId: string | null }) => {
  const isMe = currentUserId === row.actor_id;
  const Icon = row.actor_role === "coach" ? UserCog : User;
  const detail = describeDetail(row);
  return (
    <li
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5",
        isMe && "border-primary/30 bg-primary/[0.03]"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          row.actor_role === "coach"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground">
          <span className="font-semibold">{isMe ? "Moi" : row.actor_role === "coach" ? "Coach" : "Athlète"}</span>{" "}
          <span className="text-muted-foreground">{ACTION_LABELS[row.action_type] ?? row.action_type}</span>
          {detail && <span className="text-foreground"> — {detail}</span>}
        </p>
        <p className="text-[10px] text-muted-subtle tabular-nums mt-0.5">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale: fr })}
        </p>
      </div>
    </li>
  );
};

/**
 * Build a short human-readable detail from before/after JSON.
 * Best-effort — falls back to nothing when the payload is opaque.
 */
function describeDetail(row: ActivityLogRow): string {
  const a = row.after_value;
  const b = row.before_value;
  try {
    if (row.entity_type === "meal" && (a?.name || b?.name)) {
      return `« ${a?.name ?? b?.name} »`;
    }
    if (row.entity_type === "meal_food") {
      const food = a?.food_name ?? b?.food_name;
      if (food) return `« ${food} »`;
    }
    if (row.entity_type === "plan" && a && Object.keys(a).length > 0) {
      const fields = Object.keys(a).slice(0, 3).join(", ");
      return fields;
    }
  } catch { /* noop */ }
  return "";
}

export default ActivityFeed;