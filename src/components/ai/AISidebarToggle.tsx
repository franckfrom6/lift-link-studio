import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureAccess } from "@/providers/PlanProvider";

interface AISidebarToggleProps {
  onClick: () => void;
}

const AISidebarToggle = ({ onClick }: AISidebarToggleProps) => {
  const { isEnabled } = useFeatureAccess("ai_chat");

  // Don't show at all if feature not available
  if (!isEnabled) return null;

  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Bot className="w-5 h-5" strokeWidth={1.5} />
    </Button>
  );
};

export default AISidebarToggle;
