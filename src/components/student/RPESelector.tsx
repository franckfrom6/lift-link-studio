import { cn } from "@/lib/utils";

interface RPESelectorProps {
  value: number | null;
  onChange: (rpe: number) => void;
  disabled?: boolean;
}

const RPE_COLORS: Record<number, string> = {
  1: "bg-success-bg text-success",
  2: "bg-success-bg text-success",
  3: "bg-success-bg text-success",
  4: "bg-tag-violet-bg text-tag-violet",
  5: "bg-tag-violet-bg text-tag-violet",
  6: "bg-tag-violet-bg text-tag-violet",
  7: "bg-tag-orange-bg text-tag-orange",
  8: "bg-tag-orange-bg text-tag-orange",
  9: "bg-destructive/10 text-destructive",
  10: "bg-destructive/10 text-destructive",
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
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
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
