import { useEffect, useRef } from "react";
import { X, Trash2, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import AIChatInput from "./AIChatInput";
import { useAIChat } from "@/hooks/useAIChat";
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

const AISidebar = ({ open, onClose }: AISidebarProps) => {
  const { t } = useTranslation(["ai_chat", "common"]);
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isEnabled,
    initialLoaded,
    sendMessage,
    clearHistory,
    loadHistory,
  } = useAIChat({
    onMessageSent: () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
  });

  // Load history on first open
  useEffect(() => {
    if (open && !initialLoaded) loadHistory();
  }, [open, initialLoaded, loadHistory]);

  // Body scroll lock when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !sidebarRef.current) return;
    const sidebar = sidebarRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const focusable = sidebar.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const firstFocusable = sidebar.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("ai_chat:title")}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[340px] md:w-[380px] lg:w-[400px] bg-background border-l border-border shadow-xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-bold text-sm">{t("ai_chat:title")}</h2>
          </div>
          <div className="flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={messages.length === 0} aria-label={t("ai_chat:clear_history")}>
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("ai_chat:clear_history")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("common:delete_confirm_msg", { name: t("ai_chat:title") })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common:cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory}>{t("common:confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">
                  {t("ai_chat:greeting", { name: profile?.full_name?.split(" ")[0] || "" })}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border shrink-0">
          {!isEnabled ? (
            <p className="text-xs text-center text-muted-foreground">{t("ai_chat:plan_required")}</p>
          ) : (
            <AIChatInput onSend={sendMessage} disabled={isLoading} />
          )}
        </div>
      </div>
    </>
  );
};

export default AISidebar;
