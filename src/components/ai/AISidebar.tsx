import { useEffect, useRef, useState } from "react";
import { X, Trash2, Zap, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { useAIChat } from "@/hooks/useAIChat";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AISidebarProps {
  open: boolean;
  onClose: () => void;
}

const STARTER_SUGGESTIONS = [
  "Créer une séance",
  "Analyser ma semaine",
  "Conseil nutrition",
];

const AISidebar = ({ open, onClose }: AISidebarProps) => {
  const { t } = useTranslation(["ai_chat", "common"]);
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const {
    messages,
    isLoading,
    isEnabled,
    initialLoaded,
    sendMessage,
    clearHistory,
    loadHistory,
  } = useAIChat({
    onMessageSent: () =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
  });

  useEffect(() => {
    if (open && !initialLoaded) loadHistory();
  }, [open, initialLoaded, loadHistory]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage(text);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSuggestion = (s: string) => {
    if (isLoading) return;
    sendMessage(s);
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";

  const lastAssistantSuggestions =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    !isLoading
      ? messages[messages.length - 1].suggestions || []
      : [];

  // Compute consecutive-assistant grouping: only show avatar on the LAST of a run
  const showAvatarAt = (i: number) => {
    if (messages[i].role !== "assistant") return false;
    const next = messages[i + 1];
    return !next || next.role !== "assistant";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("ai_chat:title")}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[380px] z-50 flex flex-col bg-background sm:border-l border-border shadow-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-bold text-base">VOLT</h2>
            <span
              className="w-2 h-2 rounded-full bg-emerald-500"
              aria-label="online"
            />
          </div>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  disabled={messages.length === 0}
                  aria-label={t("ai_chat:clear_history")}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("ai_chat:clear_history")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("common:delete_confirm_msg", {
                      name: t("ai_chat:title"),
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory}>
                    {t("common:confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={onClose}
              aria-label={t("common:close", "Close")}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              <Zap
                className="w-12 h-12 text-primary mb-4"
                strokeWidth={1}
              />
              <p className="font-bold text-lg">
                Salut {firstName} 👋
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Je suis VOLT, ton coach IA.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {STARTER_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    disabled={isLoading || !isEnabled}
                    className="min-h-[44px] flex items-center border border-primary/30 bg-primary/5 text-primary rounded-full px-4 py-2 text-sm font-medium active:bg-primary/15 transition-colors disabled:opacity-50"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            if (isUser) {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                </div>
              );
            }
            const withAvatar = showAvatarAt(i);
            return (
              <div key={i} className="flex justify-start items-end gap-2">
                {withAvatar ? (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap
                      className="w-3.5 h-3.5 text-primary"
                      strokeWidth={1.5}
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 shrink-0" />
                )}
                <div className="max-w-[80%] bg-secondary text-secondary-foreground rounded-2xl rounded-bl-sm px-4 py-2.5 text-[15px] leading-relaxed break-words">
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Suggestion chips under last assistant message */}
          {lastAssistantSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-9">
              {lastAssistantSuggestions.map((s, si) => (
                <button
                  key={si}
                  onClick={() => handleSuggestion(s)}
                  disabled={isLoading}
                  className="min-h-[44px] flex items-center border border-primary/30 bg-primary/5 text-primary rounded-full px-4 py-2 text-sm font-medium active:bg-primary/15 transition-colors disabled:opacity-50"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Zap
                  className="w-3.5 h-3.5 text-primary"
                  strokeWidth={1.5}
                />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                <span className="flex gap-1">
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="border-t border-border shrink-0 px-3 py-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          }}
        >
          {!isEnabled ? (
            <p className="text-xs text-center text-muted-foreground py-2">
              {t("ai_chat:plan_required")}
            </p>
          ) : (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message VOLT..."
                rows={1}
                disabled={isLoading}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-2xl border border-border bg-secondary px-4 py-3 text-[16px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send"
                className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 active:opacity-80 transition-opacity"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default AISidebar;
