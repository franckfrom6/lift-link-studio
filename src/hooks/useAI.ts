import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface AIError {
  type: "plan_required" | "rate_limited" | "ai_error" | "network_error";
  plan_required?: string;
  limit?: number;
  used?: number;
  resets_at?: string;
  message?: string;
}

interface UseAIOptions {
  action: string;
  onSuccess?: (data: any) => void;
  onError?: (error: AIError) => void;
}

export function useAI({ action, onSuccess, onError }: UseAIOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  const { i18n, t } = useTranslation("common");

  const call = async (payload: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-coach", {
        body: { action, payload, lang: i18n.language },
      });

      if (fnError) {
        // Try to parse the error body
        let parsed: any = {};
        try {
          parsed = typeof fnError === "string" ? JSON.parse(fnError) : fnError;
        } catch {
          parsed = { message: fnError.message || String(fnError) };
        }

        const aiErr: AIError = { type: "ai_error", message: parsed.message || "AI error" };

        if (parsed.error === "plan_required" || parsed.context?.error === "plan_required") {
          aiErr.type = "plan_required";
          aiErr.plan_required = parsed.plan_required || parsed.context?.plan_required;
        } else if (parsed.error === "rate_limited" || parsed.context?.error === "rate_limited") {
          aiErr.type = "rate_limited";
          aiErr.limit = parsed.limit || parsed.context?.limit;
          aiErr.used = parsed.used || parsed.context?.used;
          aiErr.resets_at = parsed.resets_at || parsed.context?.resets_at;
        }

        setError(aiErr);
        onError?.(aiErr);

        if (aiErr.type === "plan_required") {
          toast.error(t("ai_plan_required"));
        } else if (aiErr.type === "rate_limited") {
          toast.error(t("ai_rate_limited"));
        } else {
          const detail = parsed.message || parsed.error || String(fnError);
          toast.error(`${t("ai_error")} ${detail}`);
        }
        return null;
      }

      if (data?.error) {
        const aiErr: AIError = { type: "ai_error", message: data.error };
        if (data.error === "plan_required") {
          aiErr.type = "plan_required";
          aiErr.plan_required = data.plan_required;
          toast.error(t("ai_plan_required"));
        } else if (data.error === "rate_limited") {
          aiErr.type = "rate_limited";
          aiErr.limit = data.limit;
          aiErr.used = data.used;
          aiErr.resets_at = data.resets_at;
          toast.error(t("ai_rate_limited"));
        } else {
          toast.error(t("ai_error"));
        }
        setError(aiErr);
        onError?.(aiErr);
        return null;
      }

      onSuccess?.(data);
      return data;
    } catch (e: any) {
      const aiErr: AIError = { type: "network_error", message: e.message };
      setError(aiErr);
      onError?.(aiErr);
      toast.error(t("ai_network_error"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { call, isLoading, error };
}
