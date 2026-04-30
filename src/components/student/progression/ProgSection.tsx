import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface ProgSectionProps {
  title: string;
  action?: string;            // optional CTA label, e.g. "Tout voir"
  onAction?: () => void;
  children: ReactNode;
}

/**
 * Sage Progression — section header + content wrapper.
 */
const ProgSection = ({ title, action, onAction, children }: ProgSectionProps) => (
  <div className="px-4 pb-4 pt-2">
    <div className="flex items-center justify-between mb-2.5 px-1">
      <h3 className="text-[13px] font-bold tracking-tight text-foreground m-0">{title}</h3>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          {action}
          <ChevronRight className="w-3 h-3" strokeWidth={2} />
        </button>
      )}
    </div>
    {children}
  </div>
);

export default ProgSection;