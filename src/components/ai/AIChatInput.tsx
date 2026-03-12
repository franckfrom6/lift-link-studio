import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AIChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

const AIChatInput = ({ onSend, disabled }: AIChatInputProps) => {
  const { t } = useTranslation("ai_chat");
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("placeholder")}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 min-h-[40px] max-h-[120px]"
        style={{ height: "40px" }}
        onInput={e => {
          const el = e.target as HTMLTextAreaElement;
          el.style.height = "40px";
          el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }}
      />
      <Button
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        aria-label={t("send", "Send message")}
      >
        <Send className="w-4 h-4" strokeWidth={1.5} />
      </Button>
    </div>
  );
};

export default AIChatInput;
