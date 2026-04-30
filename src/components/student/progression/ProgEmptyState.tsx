import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface ProgEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Sage Progression — elegant empty state for placeholder blocks
 * (used by "Records récents" and "Historique" until data is wired).
 */
const ProgEmptyState = ({ icon: Icon, title, description, action }: ProgEmptyStateProps) => (
  <div className="bg-card border border-dashed border-border rounded-md px-4 py-6 flex flex-col items-center text-center gap-2">
    <div className="w-9 h-9 rounded-sm bg-bg-tinted flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <div className="text-[13px] font-semibold text-foreground tracking-tight">{title}</div>
    <p className="text-[11px] text-muted-subtle font-medium leading-snug max-w-[260px] m-0">
      {description}
    </p>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export default ProgEmptyState;