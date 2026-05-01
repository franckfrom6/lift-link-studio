import { forwardRef } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureAccess } from "@/providers/PlanProvider";

interface AISidebarToggleProps {
  onClick: () => void;
}

/**
 * forwardRef so React DevTools / parent Tooltip wrappers can attach refs
 * without emitting "Function components cannot be given refs" warnings.
 */
const AISidebarToggle = forwardRef<HTMLButtonElement, AISidebarToggleProps>(
  ({ onClick }, ref) => {
    const { isEnabled } = useFeatureAccess("ai_chat");

    // Don't show at all if feature not available
    if (!isEnabled) return null;

    return (
      <Button
        ref={ref}
        onClick={onClick}
        size="icon"
        aria-label="Open AI assistant"
        className="fixed bottom-20 md:bottom-6 right-4 z-30 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Zap className="w-5 h-5" strokeWidth={1.5} />
      </Button>
    );
  }
);
AISidebarToggle.displayName = "AISidebarToggle";

export default AISidebarToggle;
