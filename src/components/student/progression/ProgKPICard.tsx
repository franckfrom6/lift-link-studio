import { cn } from "@/lib/utils";

export interface ProgKPI {
  id: string;
  label: string;
  value: string;
  unit?: string;
  delta?: string;          // e.g. "+2"
  sub?: string;            // e.g. "vs S2"
  deltaTone?: "up" | "down-good" | "neutral";
}

/**
 * Sage Progression — KPI tile (used in the 2×2 grid).
 * Pure tokens; tabular numerics; no shadow.
 */
const ProgKPICard = ({ kpi }: { kpi: ProgKPI }) => {
  const tone =
    kpi.deltaTone === "up" || kpi.deltaTone === "down-good"
      ? "text-success"
      : "text-muted-foreground";
  return (
    <div className="flex flex-col gap-1 px-3 pt-3 pb-2.5 bg-card border border-border rounded-md">
      <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {kpi.label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold tabular-nums tracking-tight text-foreground leading-none">
          {kpi.value}
        </span>
        {kpi.unit && (
          <span className="text-[11px] font-medium text-muted-subtle">{kpi.unit}</span>
        )}
      </div>
      {(kpi.delta || kpi.sub) && (
        <div className="flex items-center gap-1 mt-0.5">
          {kpi.delta && (
            <span className={cn("text-[10px] font-bold tabular-nums", tone)}>
              {kpi.delta}
            </span>
          )}
          {kpi.sub && (
            <span className="text-[9px] font-medium text-muted-subtle">· {kpi.sub}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgKPICard;