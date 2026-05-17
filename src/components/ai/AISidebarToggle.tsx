import { forwardRef, useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { useFeatureAccess } from "@/providers/PlanProvider";
import { useAIChat } from "@/hooks/useAIChat";

interface AISidebarToggleProps {
  onClick: () => void;
}

const AISidebarToggle = forwardRef<HTMLButtonElement, AISidebarToggleProps>(
  ({ onClick }, ref) => {
    const { isEnabled } = useFeatureAccess("ai_chat");
    const { messages } = useAIChat();
    const [pulse, setPulse] = useState(false);
    const lastAssistantIdRef = useRef<string>("");

    useEffect(() => {
      if (messages.length === 0) return;
      const last = messages[messages.length - 1];
      if (last.role !== "assistant") return;
      const key = last.id || `${messages.length}:${last.content.slice(0, 20)}`;
      if (key === lastAssistantIdRef.current) return;
      lastAssistantIdRef.current = key;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 3000);
      return () => clearTimeout(t);
    }, [messages]);

    if (!isEnabled) return null;

    return (
      <button
        ref={ref}
        onClick={onClick}
        aria-label="Open AI assistant"
        className="fixed bottom-20 md:bottom-6 right-4 z-30 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform flex items-center justify-center"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
        <Zap className="w-6 h-6 relative" strokeWidth={1.5} />
      </button>
    );
  }
);
AISidebarToggle.displayName = "AISidebarToggle";

export default AISidebarToggle;
