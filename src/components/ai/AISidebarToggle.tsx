import { forwardRef } from "react";
import { Zap } from "lucide-react";
import { useFeatureAccess } from "@/providers/PlanProvider";

interface AISidebarToggleProps {
  onClick: () => void;
}

const AISidebarToggle = forwardRef<HTMLButtonElement, AISidebarToggleProps>(
  ({ onClick }, ref) => {
    const { isEnabled } = useFeatureAccess("ai_chat");
    if (!isEnabled) return null;

    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label="Open AI assistant"
        className="fixed bottom-20 md:bottom-6 right-4 z-30 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform flex items-center justify-center"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <Zap className="w-6 h-6" strokeWidth={1.5} />
      </button>
    );
  }
);
AISidebarToggle.displayName = "AISidebarToggle";

export default AISidebarToggle;
