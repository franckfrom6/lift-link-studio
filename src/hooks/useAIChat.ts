import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { usePlan, useFeatureAccess } from "@/providers/PlanProvider";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  context_page?: string;
  suggestions?: string[];
}

interface UseAIChatOptions {
  onMessageSent?: () => void;
}

export interface ChatAttachment {
  name: string;
  type: string;
  base64: string;
}

export function useAIChat(options?: UseAIChatOptions) {
  const { t } = useTranslation("ai_chat");
  const { user, profile, role } = useAuth();
  const { currentPlan } = usePlan();
  const { isEnabled } = useFeatureAccess("ai_chat");
  const location = useLocation();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Reset chat state when the signed-in user changes (logout/login or account switch).
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const uid = user?.id ?? null;
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== uid) {
      setMessages([]);
      setInitialLoaded(false);
    }
    prevUserIdRef.current = uid;
  }, [user?.id]);

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

  const sendMessage = useCallback(async (text: string, file?: ChatAttachment) => {
    if (!user || (!text.trim() && !file)) return;

    if (!isEnabled) {
      toast.error(t("plan_required"));
      return;
    }

    const displayText = text.trim() || (file ? `📎 ${file.name}` : "");
    const userMsg: Message = { role: "user", content: displayText, context_page: location.pathname };
    setMessages(prev => [...prev, userMsg]);

    const { error: insertError } = await supabase.from("ai_chat_messages").insert({
      user_id: user.id,
      role: "user",
      content: displayText,
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
            attachment: file,
          },
          lang: "fr",
        },
      });

      if (fnError) {
        let parsed: any = {};
        try {
          const body = await (fnError as any).context?.json?.();
          parsed = body || {};
        } catch {
          parsed = { message: (fnError as any).message || String(fnError) };
        }
        if (parsed.error === "plan_required") toast.error(t("plan_required"));
        else if (parsed.error === "rate_limited") toast.error(t("rate_limited"));
        else if (
          parsed.error === "AI not configured" ||
          parsed.error === "Anthropic API key not configured" ||
          parsed.message?.includes("not configured")
        ) {
          toast.error("VOLT IA n'est pas encore configuré sur ce projet. Contactez le support.");
        }
        else toast.error(t("error"));
        setIsLoading(false);
        return;
      }

      const rawAssistantContent =
        data?.text || data?.message || data?.result?.text || data?.result?.message || JSON.stringify(data);
      // If VOLT created a session, immediately refresh the calendar
      const toolResults: any[] = data?.result?.tool_results || [];
      const sessionCreated = toolResults.some(
        (tr: any) => tr.tool === "create_free_session" && tr.success === true
      );
      if (sessionCreated) {
        queryClient.invalidateQueries({ queryKey: ["week-free-sessions"] });
        queryClient.invalidateQueries({ queryKey: ["month-sessions"] });
      }
      const rawSuggestions =
        data?.suggestions ?? data?.result?.suggestions ?? [];
      let suggestions: string[] = Array.isArray(rawSuggestions)
        ? rawSuggestions.map((s: unknown) => String(s)).filter(Boolean)
        : [];
      let assistantContent = rawAssistantContent;
      if (suggestions.length === 0 && typeof assistantContent === "string") {
        const m = assistantContent.match(/<suggestions>([\s\S]*?)<\/suggestions>/);
        if (m) {
          try {
            const parsed = JSON.parse(m[1]);
            if (Array.isArray(parsed)) {
              suggestions = parsed.map((s: unknown) => String(s)).filter(Boolean);
            }
          } catch { /* ignore */ }
        }
      }
      if (typeof assistantContent === "string") {
        assistantContent = assistantContent
          .replace(/<suggestions>[\s\S]*?<\/suggestions>/g, "")
          .trim();
      }
      const assistantMsg: Message = {
        role: "assistant",
        content: assistantContent,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);

      const { error: saveError } = await supabase.from("ai_chat_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: assistantContent,
        context_page: location.pathname,
      });
      if (saveError) console.error("Error saving assistant message:", saveError);
    } catch (e) {
      console.error("VOLT AI error details:", e);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [user, isEnabled, messages, buildContext, location.pathname, t, options, queryClient]);

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
