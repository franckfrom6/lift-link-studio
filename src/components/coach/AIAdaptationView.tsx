import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, AlertTriangle, Check, X, Loader2, Send, Dumbbell, ChevronDown, ChevronUp, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AIAdaptationViewProps {
  studentId: string;
  programId: string;
  weekNumber: number;
  studentName: string;
}

interface ProposedExercise {
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  rpe_target?: string;
  coach_notes?: string;
}

interface ProposedSection {
  name: string;
  exercises: ProposedExercise[];
}

interface ProposedSession {
  name: string;
  day_of_week: number;
  notes?: string;
  sections: ProposedSection[];
}

interface PainAlert {
  location: string;
  recommendation: string;
  should_see_professional: boolean;
}

interface AdaptationResult {
  weekly_summary: string;
  load_assessment: string;
  key_changes: string[];
  pain_alerts: PainAlert[];
  proposed_sessions: ProposedSession[];
  coach_message_suggestion?: string;
}

const LOAD_COLORS: Record<string, string> = {
  under_stimulated: "text-info bg-info-bg border-info/30",
  optimal: "text-success bg-success-bg border-success/30",
  slightly_high: "text-warning bg-warning-bg border-warning/30",
  overreaching: "text-destructive bg-danger-bg border-destructive/30",
};

const DAYS_FR = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const DAYS_EN = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AIAdaptationView = ({ studentId, programId, weekNumber, studentName }: AIAdaptationViewProps) => {
  const { t, i18n } = useTranslation("feedback");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<AdaptationResult | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set([0]));
  const [applied, setApplied] = useState(false);

  const days = i18n.language === "fr" ? DAYS_FR : DAYS_EN;

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const { data, error } = await supabase.functions.invoke("adapt-next-week", {
        body: { student_id: studentId, program_id: programId, week_number: weekNumber, language: i18n.language },
      });
      if (error) throw error;
      setResult(data);
      // Expand all sessions by default
      if (data?.proposed_sessions) {
        setExpandedSessions(new Set(data.proposed_sessions.map((_: any, i: number) => i)));
      }
    } catch (e: any) {
      toast.error(e.message || "Error generating adaptation");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result?.proposed_sessions?.length || !user) return;
    setApplying(true);

    try {
      // 1. Create a new week
      const { data: existingWeeks } = await supabase
        .from("program_weeks")
        .select("week_number")
        .eq("program_id", programId)
        .order("week_number", { ascending: false })
        .limit(1);

      const nextWeekNum = (existingWeeks?.[0]?.week_number || 0) + 1;

      const { data: newWeek, error: weekErr } = await supabase
        .from("program_weeks")
        .insert({ program_id: programId, week_number: nextWeekNum })
        .select("id")
        .single();
      if (weekErr) throw weekErr;

      // 2. For each proposed session, create session + sections + exercises
      for (const session of result.proposed_sessions) {
        const { data: newSession, error: sessErr } = await supabase
          .from("sessions")
          .insert({
            week_id: newWeek.id,
            name: session.name,
            day_of_week: session.day_of_week,
            notes: session.notes || null,
          })
          .select("id")
          .single();
        if (sessErr) throw sessErr;

        for (let sIdx = 0; sIdx < session.sections.length; sIdx++) {
          const section = session.sections[sIdx];

          const { data: newSection, error: secErr } = await supabase
            .from("session_sections")
            .insert({
              session_id: newSession.id,
              name: section.name,
              sort_order: sIdx,
            })
            .select("id")
            .single();
          if (secErr) throw secErr;

          for (let eIdx = 0; eIdx < section.exercises.length; eIdx++) {
            const ex = section.exercises[eIdx];

            // Try to find the exercise in the DB by name
            const { data: dbExercise } = await supabase
              .from("exercises")
              .select("id")
              .ilike("name", ex.name)
              .limit(1)
              .maybeSingle();

            let exerciseId = dbExercise?.id;

            // If not found, create it
            if (!exerciseId) {
              const { data: created } = await supabase
                .from("exercises")
                .insert({
                  name: ex.name,
                  muscle_group: "other",
                  equipment: "bodyweight",
                  type: "compound",
                  created_by: user.id,
                })
                .select("id")
                .single();
              exerciseId = created?.id;
            }

            if (exerciseId) {
              await supabase.from("session_exercises").insert({
                session_id: newSession.id,
                section_id: newSection.id,
                exercise_id: exerciseId,
                sort_order: eIdx,
                sets: ex.sets,
                reps_min: ex.reps_min,
                reps_max: ex.reps_max,
                rest_seconds: ex.rest_seconds,
                rpe_target: ex.rpe_target || null,
                coach_notes: ex.coach_notes || null,
              });
            }
          }
        }
      }

      setApplied(true);
      toast.success(t('week_created', { number: nextWeekNum, count: result.proposed_sessions.length }));
    } catch (e: any) {
      console.error("Apply error:", e);
      toast.error(e.message || "Error applying program");
    } finally {
      setApplying(false);
    }
  };

  const toggleSession = (idx: number) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (!result) {
    return (
      <Button onClick={handleGenerate} disabled={loading} className="w-full gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
        {loading ? t('analyzing_generating') : t('generate_adapted')}
      </Button>
    );
  }

  const loadClass = LOAD_COLORS[result.load_assessment] || LOAD_COLORS.optimal;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-accent-foreground" />
        <h3 className="font-bold text-sm">
          {t('adapted_program_week', { number: weekNumber + 1 })}
        </h3>
      </div>

      {/* Summary + Load assessment */}
      <div className="glass p-4 space-y-2">
        <p className="text-sm">{result.weekly_summary}</p>
        <Badge variant="outline" className={cn("text-xs", loadClass)}>
          {t('load')}: {result.load_assessment?.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Key changes */}
      {result.key_changes?.length > 0 && (
        <div className="glass p-4 space-y-2">
          <p className="text-xs font-bold text-muted-foreground">
            {t('key_changes')}
          </p>
          <ul className="space-y-1">
            {result.key_changes.map((change, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pain alerts */}
      {result.pain_alerts?.length > 0 && (
        <div className="space-y-2">
          {result.pain_alerts.map((alert, i) => (
            <div key={i} className="glass p-3 border-l-4 border-destructive bg-danger-bg/50 space-y-1">
              <p className="text-sm font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {alert.location}
              </p>
              <p className="text-xs">{alert.recommendation}</p>
              {alert.should_see_professional && (
                <p className="text-xs text-destructive font-medium">
                  → {t('professional_consultation')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Proposed sessions */}
      {result.proposed_sessions?.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground">
            {t('proposed_sessions', { count: result.proposed_sessions.length })}
          </p>
          
          {result.proposed_sessions.map((session, sIdx) => {
            const isExpanded = expandedSessions.has(sIdx);
            const totalExercises = session.sections.reduce((a, s) => a + s.exercises.length, 0);

            return (
              <div key={sIdx} className="glass overflow-hidden">
                <button
                  onClick={() => toggleSession(sIdx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-accent-foreground" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{session.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {days[session.day_of_week] || `Day ${session.day_of_week}`} · {totalExercises} ex. · {session.sections.length} blocs
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {session.notes && (
                      <p className="text-xs text-muted-foreground italic">💬 {session.notes}</p>
                    )}
                    {session.sections.map((section, secIdx) => (
                      <div key={secIdx} className="space-y-1.5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{section.name}</p>
                        {section.exercises.map((ex, exIdx) => (
                          <div key={exIdx} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                            <span className="text-[10px] font-bold text-accent-foreground w-5 shrink-0">{exIdx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{ex.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{ex.sets}×{ex.reps_min === ex.reps_max ? ex.reps_min : `${ex.reps_min}-${ex.reps_max}`}</span>
                                {ex.rpe_target && <Badge variant="outline" className="text-[9px] h-4 px-1">RPE {ex.rpe_target}</Badge>}
                                {ex.rest_seconds > 0 && <span>⏱ {ex.rest_seconds}s</span>}
                              </div>
                              {ex.coach_notes && <p className="text-[10px] text-muted-foreground italic mt-0.5">💡 {ex.coach_notes}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Coach message suggestion */}
      {result.coach_message_suggestion && (
        <div className="glass p-3 space-y-2">
          <p className="text-xs font-bold text-muted-foreground">
            💬 {i18n.language === "fr" ? "Message suggéré pour l'athlète" : "Suggested message for athlete"}
          </p>
          <p className="text-sm italic">"{result.coach_message_suggestion}"</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!applied ? (
          <>
            <Button
              onClick={handleApply}
              disabled={applying || !result.proposed_sessions?.length}
              className="flex-1 gap-2"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {applying
                ? (i18n.language === "fr" ? "Création en cours..." : "Creating...")
                : (i18n.language === "fr" ? "Appliquer ce programme" : "Apply this program")
              }
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {i18n.language === "fr" ? "Regénérer" : "Regenerate"}
            </Button>
          </>
        ) : (
          <div className="w-full text-center py-3">
            <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              {i18n.language === "fr" ? "Programme appliqué avec succès !" : "Program applied successfully!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdaptationView;
