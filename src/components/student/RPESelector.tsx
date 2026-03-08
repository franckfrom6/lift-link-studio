import { cn } from "@/lib/utils";

interface RPESelectorProps {
  value: number | null;
  onChange: (rpe: number) => void;
  disabled?: boolean;
}

const RPE_COLORS: Record<number, string> = {
  1: "bg-success/20 text-success",
  2: "bg-success/20 text-success",
  3: "bg-success/30 text-success",
  4: "bg-primary/20 text-primary",
  5: "bg-primary/20 text-primary",
  6: "bg-primary/30 text-primary",
  7: "bg-warning/20 text-warning",
  8: "bg-warning/30 text-warning",
  9: "bg-destructive/20 text-destructive",
  10: "bg-destructive/30 text-destructive",
};

const RPESelector = ({ value, onChange, disabled }: RPESelectorProps) => {
  return (
    <div className="flex gap-1 flex-wrap">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => (
        <button
          key={rpe}
          type="button"
          disabled={disabled}
          onClick={() => onChange(rpe)}
          className={cn(
            "w-7 h-7 rounded-md text-[11px] font-bold transition-all",
            value === rpe
              ? RPE_COLORS[rpe] + " ring-1 ring-current scale-110"
              : "bg-surface text-muted-foreground hover:bg-surface/80",
            disabled && "opacity-40 cursor-not-allowed"
          )}
        >
          {rpe}
        </button>
      ))}
    </div>
  );
};

export default RPESelector;
