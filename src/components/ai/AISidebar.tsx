import { useEffect, useState, useRef, useCallback } from "react";
import { X, Send, Trash2, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { usePlan, useFeatureAccess } from "@/providers/PlanProvider";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import AIChatInput from "./AIChatInput";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  context_page?: string;
}

interface AISidebarProps {
  open: boolean;
  onClose: () => void;
}

const AISidebar = ({ open, onClose }: AISidebarProps) => {
  const { t } = useTranslation("ai_chat");
  const { user, profile, role } = useAuth();
  const { currentPlan } = usePlan();
  const { isEnabled, limit } = useFeatureAccess("ai_chat");
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    if (!user || initialLoaded) return;
    const load = async () => {
      const { data } = await supabase
        .from("ai_chat_messages")
        .select("id, role, content, context_page")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data as Message[]);
      setInitialLoaded(true);
    };
    load();
  }, [user, initialLoaded]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = useCallback(() => {
    const ctx: string[] = [];
    ctx.push(`Rôle : ${role || "athlète"}`);
    ctx.push(`Plan : ${currentPlan?.name || "free"}`);
    ctx.push(`Page actuelle : ${location.pathname}`);
    if (profile) {
      ctx.push(`Nom : ${profile.full_name}`);
      if (profile.goal) ctx.push(`Objectif : ${profile.goal}`);
      if (profile.level) ctx.push(`Niveau : ${profile.level}`);
    }
    return ctx.join("\n");
  }, [role, currentPlan, location.pathname, profile]);

  const handleSend = async (text: string) => {
    if (!user || !text.trim()) return;

    if (!isEnabled) {
      toast.error(t("plan_required"));
      return;
    }

    const userMsg: Message = { role: "user", content: text, context_page: location.pathname };
    setMessages(prev => [...prev, userMsg]);

    // Save user message
    await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: text,
      context_page: location.pathname,
    });

    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;
      if (!accessToken) {
        toast.error(t("error"));
        setIsLoading(false);
        return;
      }
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "chat",
          payload: {
            messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })),
            context: buildContext(),
          },
          lang: "fr",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (err.error === "plan_required") toast.error(t("plan_required"));
        else if (err.error === "rate_limited") toast.error(t("rate_limited"));
        else toast.error(t("error"));
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      const assistantContent = data?.text || data?.message || data?.result?.text || data?.result?.message || JSON.stringify(data);

      const assistantMsg: Message = { role: "assistant", content: assistantContent };
      setMessages(prev => [...prev, assistantMsg]);

      // Save assistant message
      await supabase.from("ai_chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: assistantContent,
        context_page: location.pathname,
      });
    } catch (e) {
      console.error(e);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!user) return;
    await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[360px] bg-background border-l border-border shadow-xl flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-sm">{t("title")}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Button>
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
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">
                {t("greeting", { name: profile?.full_name?.split(" ")[0] || "" })}
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
          <p className="text-xs text-center text-muted-foreground">{t("plan_required")}</p>
        ) : (
          <AIChatInput onSend={handleSend} disabled={isLoading} />
        )}
      </div>
    </div>
  );
};

export default AISidebar;
