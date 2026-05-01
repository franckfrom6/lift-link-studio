import { useState } from "react";
import { ChevronDown, Check, Filter as FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type ActivityFilter = "all" | "programmed" | "completed" | "external";

const ACTIVITY_LABELS: Record<ActivityFilter, string> = {
  all: "Toutes",
  programmed: "Programmées",
  completed: "Terminées",
  external: "Externes",
};

interface MonthFiltersProps {
  activity: ActivityFilter;
  onActivityChange: (value: ActivityFilter) => void;
  /** All available muscle groups present in the displayed month */
  availableTypes: string[];
  /** Active type filter (null = all types) */
  selectedType: string | null;
  onTypeChange: (value: string | null) => void;
}

/**
 * Compact filter bar above the monthly grid.
 * Two pill-style dropdowns: activity scope + session type (muscle group).
 */
const MonthFilters = ({
  activity,
  onActivityChange,
  availableTypes,
  selectedType,
  onTypeChange,
}: MonthFiltersProps) => {
  const hasFilters = activity !== "all" || selectedType !== null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border overflow-x-auto scrollbar-none">
      <FilterIcon
        className={cn(
          "w-3.5 h-3.5 shrink-0",
          hasFilters ? "text-primary" : "text-muted-subtle"
        )}
        strokeWidth={2}
      />

      {/* Activity scope */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold tracking-tight transition-colors shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activity !== "all"
                ? "bg-primary/10 text-primary"
                : "bg-bg-tinted text-foreground hover:bg-bg-tinted/80"
            )}
            aria-label="Filtrer par activité"
          >
            {ACTIVITY_LABELS[activity]}
            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-subtle">
            Activité
          </DropdownMenuLabel>
          {(Object.keys(ACTIVITY_LABELS) as ActivityFilter[]).map((key) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onActivityChange(key)}
              className="text-xs"
            >
              <span className="flex-1">{ACTIVITY_LABELS[key]}</span>
              {activity === key && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Session type (muscle group) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={availableTypes.length === 0}
            className={cn(
              "inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold tracking-tight transition-colors shrink-0",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              selectedType
                ? "bg-primary/10 text-primary"
                : "bg-bg-tinted text-foreground hover:bg-bg-tinted/80"
            )}
            aria-label="Filtrer par type de séance"
          >
            {selectedType ?? "Type"}
            <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 max-h-72 overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-subtle">
            Type de séance
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onTypeChange(null)} className="text-xs">
            <span className="flex-1">Tous</span>
            {selectedType === null && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
          {availableTypes.length > 0 && <DropdownMenuSeparator />}
          {availableTypes.map((type) => (
            <DropdownMenuItem
              key={type}
              onClick={() => onTypeChange(type)}
              className="text-xs capitalize"
            >
              <span className="flex-1">{type}</span>
              {selectedType === type && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onActivityChange("all");
            onTypeChange(null);
          }}
          className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
};

export default MonthFilters;