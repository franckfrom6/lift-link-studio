import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { usePlan, useFeatureAccess } from "@/providers/PlanProvider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  context_page?: string;
}

interface UseAIChatOptions {
  onMessageSent?: () => void;
}

export function useAIChat(options?: UseAIChatOptions) {
  const { t } = useTranslation("ai_chat");
  const { user, profile, role } = useAuth();
  const { currentPlan } = usePlan();
  const { isEnabled } = useFeatureAccess("ai_chat");
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user || initialLoaded) return;
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("id, role, content, context_page")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) {
      console.error("Error loading chat history:", error);
      toast.error(t("error"));
    } else if (data) {
      setMessages(data as Message[]);
    }
    setInitialLoaded(true);
  }, [user, initialLoaded, t]);

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

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim()) return;

    if (!isEnabled) {
      toast.error(t("plan_required"));
      return;
    }

    const userMsg: Message = { role: "user", content: text, context_page: location.pathname };
    setMessages(prev => [...prev, userMsg]);

    const { error: insertError } = await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: text,
      context_page: location.pathname,
    });
    if (insertError) console.error("Error saving user message:", insertError);

    setIsLoading(true);
    options?.onMessageSent?.();

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-coach", {
        body: {
          action: "chat",
          payload: {
            messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
            context: buildContext(),
          },
          lang: "fr",
        },
      });

      if (fnError) {
        let parsed: any = {};
        try {
          parsed = typeof fnError === "string" ? JSON.parse(fnError) : fnError;
        } catch {
          parsed = { message: fnError.message || String(fnError) };
        }
        if (parsed.error === "plan_required") toast.error(t("plan_required"));
        else if (parsed.error === "rate_limited") toast.error(t("rate_limited"));
        else toast.error(t("error"));
        setIsLoading(false);
        return;
      }

      const assistantContent = data?.text || data?.message || data?.result?.text || data?.result?.message || JSON.stringify(data);
      const assistantMsg: Message = { role: "assistant", content: assistantContent };
      setMessages(prev => [...prev, assistantMsg]);

      const { error: saveError } = await supabase.from("ai_chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: assistantContent,
        context_page: location.pathname,
      });
      if (saveError) console.error("Error saving assistant message:", saveError);
    } catch (e) {
      console.error(e);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [user, isEnabled, messages, buildContext, location.pathname, t, options]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from("ai_chat_messages").delete().eq("user_id", user.id);
    if (error) {
      console.error("Error clearing chat:", error);
      toast.error(t("error"));
      return;
    }
    setMessages([]);
  }, [user, t]);

  return {
    messages,
    isLoading,
    isEnabled,
    initialLoaded,
    sendMessage,
    clearHistory,
    loadHistory,
  };
}
