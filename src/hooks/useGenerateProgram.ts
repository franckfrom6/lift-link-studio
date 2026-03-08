import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProgramData, SessionData, SessionSectionData, ProgressionPhaseData } from "@/types/coach";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AIStructuredInput {
  objective?: string;
  level?: string;
  frequency?: string;
  duration?: string;
  equipment?: string;
  notes?: string;
}

function makeExercisePlaceholder(name: string) {
  return {
    id: crypto.randomUUID(),
    name,
    muscle_group: "Autre",
    equipment: "Autre",
    type: "compound",
    is_default: false,
    created_at: new Date().toISOString(),
    created_by: null,
    description: null,
    image_url: null,
    secondary_muscle: null,
  };
}

export function useGenerateProgram() {
  const [loading, setLoading] = useState(false);
  const { i18n, t } = useTranslation("common");

  const generate = async (
    prompt: string,
    structured?: AIStructuredInput
  ): Promise<ProgramData | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          action: "generate_program",
          payload: { prompt, structured },
          lang: i18n.language,
        },
      });

      if (error) {
      const detail = (error as any).context?.error || error.message || "Erreur inconnue";
      toast.error("Erreur IA : " + detail);
        return null;
      }

      if (data?.error) {
        if (data.error === "plan_required") {
          toast.error(t("ai_plan_required"));
        } else if (data.error === "rate_limited") {
          toast.error(t("ai_rate_limited"));
        } else {
          toast.error(data.error);
        }
        return null;
      }

      const ai = data.program;
      if (!ai) {
        toast.error("L'IA n'a pas pu générer le programme");
        return null;
      }

      const programData: ProgramData = {
        id: crypto.randomUUID(),
        name: ai.name,
        studentId: "",
        status: "draft",
        weeks: ai.weeks.map((w: any) => ({
          id: crypto.randomUUID(),
          weekNumber: w.week_number,
          sessions: (w.sessions || []).map((s: any) => {
            const sections: SessionSectionData[] = (s.sections || []).map((sec: any, si: number) => ({
              id: crypto.randomUUID(),
              name: sec.name,
              icon: sec.icon || undefined,
              sortOrder: si,
              durationEstimate: sec.duration_estimate || undefined,
              notes: sec.notes || undefined,
              exercises: (sec.exercises || []).map((ex: any, ei: number) => ({
                id: crypto.randomUUID(),
                exercise: makeExercisePlaceholder(ex.name),
                sortOrder: ei,
                sets: ex.sets || 3,
                repsMin: ex.reps_min || 8,
                repsMax: ex.reps_max || 12,
                restSeconds: ex.rest_seconds || 90,
                suggestedWeight: ex.suggested_weight || undefined,
                coachNotes: ex.coach_notes || undefined,
                tempo: ex.tempo || undefined,
                rpeTarget: ex.rpe_target || undefined,
                videoUrl: ex.video_url || undefined,
                videoSearchQuery: ex.video_search_query || undefined,
              })),
            }));
            return {
              id: crypto.randomUUID(),
              dayOfWeek: s.day_of_week,
              name: s.name,
              sections,
              exercises: [],
            } as SessionData;
          }),
        })),
        progression: [],
      };

      const progression: ProgressionPhaseData[] = (ai.progression || []).map((p: any, i: number) => ({
        weekLabel: p.week_label,
        description: p.description,
        weekStart: p.week_start,
        weekEnd: p.week_end,
        isDeload: p.is_deload || false,
        order: i,
      }));

      programData.progression = progression;

      toast.success("Programme généré par l'IA ! Vous pouvez maintenant l'éditer.");
      return programData;
    } catch (e: any) {
      console.error("AI generate error:", e);
      toast.error("Erreur lors de la génération : " + (e.message || "Erreur inconnue"));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading };
}
