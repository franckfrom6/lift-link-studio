import { Link2, Link2Off } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiSetToggleProps {
  linked: boolean;
  onToggle: () => void;
}

/**
 * Renders between two adjacent exercise cards. Clicking links/unlinks them
 * as a bi-set (superset) pair.
 */
const BiSetToggle = ({ linked, onToggle }: BiSetToggleProps) => {
  return (
    <div className="relative flex items-center justify-center -my-1">
      <div
        aria-hidden
        className={cn(
          "absolute left-1/2 -translate-x-1/2 h-6 w-0.5",
          linked ? "bg-primary" : "bg-transparent",
        )}
      />
      <button
        type="button"
        onClick={onToggle}
        title={linked ? "Délier la bi-set" : "Lier en bi-set"}
        className={cn(
          "relative z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-[0.05em] transition-colors",
          linked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40",
        )}
      >
        {linked ? (
          <Link2 className="w-3 h-3" strokeWidth={2} />
        ) : (
          <Link2Off className="w-3 h-3" strokeWidth={2} />
        )}
        <span>{linked ? "Bi-set" : "+ Bi-set"}</span>
      </button>
    </div>
  );
};

export default BiSetToggle;