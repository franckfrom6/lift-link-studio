import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

interface SectionExercise {
  id: string;
  sort_order: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  tempo: string | null;
  rpe_target: string | null;
  suggested_weight: number | null;
  coach_notes: string | null;
  exercise: { id: string; name: string; name_en: string | null; muscle_group: string; equipment: string };
}

interface Section {
  id: string;
  name: string;
  sort_order: number;
  exercises: SectionExercise[];
}

interface Session {
  id: string;
  name: string;
  day_of_week: number;
  notes: string | null;
  sections: Section[];
}

interface Week {
  id: string;
  week_number: number;
  sessions: Session[];
}

interface ProgramFull {
  id: string;
  name: string;
  status: string;
  student_id: string;
  created_at: string;
  studentName?: string;
  weeks: Week[];
}

const DAY_KEYS = ["", "mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const CoachProgramDetail = () => {
  const { programId, studentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["program", "common", "session"]);
  const { user } = useAuth();

  const [program, setProgram] = useState<ProgramFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!programId || !user) return;
    fetchProgram();
  }, [programId, user]);

  const fetchProgram = async () => {
    if (!programId) return;
    setLoading(true);

    const { data: prog } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (!prog) { setLoading(false); return; }

    // Fetch student name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", prog.student_id)
      .maybeSingle();

    // Fetch weeks
    const { data: weeks } = await supabase
      .from("program_weeks")
      .select("*")
      .eq("program_id", prog.id)
      .order("week_number");

    if (!weeks || weeks.length === 0) {
      setProgram({ ...prog, studentName: profile?.full_name, weeks: [] });
      setLoading(false);
      return;
    }

    const weekIds = weeks.map(w => w.id);
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .in("week_id", weekIds)
      .order("day_of_week");

    const sessionIds = sessions?.map(s => s.id) || [];

    const { data: sections } = await supabase
      .from("session_sections")
      .select("*")
      .in("session_id", sessionIds)
      .order("sort_order");

    const { data: exercises } = await supabase
      .from("session_exercises")
      .select("*, exercise:exercises(id, name, name_en, muscle_group, equipment)")
      .in("session_id", sessionIds)
      .order("sort_order");

    // Build tree
    const sectionMap = new Map<string, Section>();
    for (const sec of (sections || [])) {
      sectionMap.set(sec.id, { ...sec, exercises: [] });
    }
    for (const ex of (exercises || [])) {
      if (ex.section_id && sectionMap.has(ex.section_id)) {
        sectionMap.get(ex.section_id)!.exercises.push(ex as any);
      }
    }

    const builtWeeks: Week[] = weeks.map(w => ({
      ...w,
      sessions: (sessions || [])
        .filter(s => s.week_id === w.id)
        .map(s => ({
          ...s,
          sections: (sections || [])
            .filter(sec => sec.session_id === s.id)
            .map(sec => sectionMap.get(sec.id)!)
            .filter(Boolean),
        })),
    }));

    setProgram({ ...prog, studentName: profile?.full_name, weeks: builtWeeks });
    // Open first session by default
    if (builtWeeks[0]?.sessions[0]) {
      setOpenSessions(new Set([builtWeeks[0].sessions[0].id]));
    }
    setLoading(false);
  };

  const toggleSession = (id: string) => {
    setOpenSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("common:not_found")}</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">{t("common:back")}</Button>
      </div>
    );
  }

  const dayLabel = (d: number) => t(`common:days.${DAY_KEYS[d]}`, DAY_KEYS[d]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{program.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {program.studentName && (
              <span className="text-sm text-muted-foreground">{program.studentName}</span>
            )}
            <Badge variant={program.status === "active" ? "default" : "secondary"} className="text-xs">
              {t(`program:status.${program.status}`, program.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 text-center">
          <Calendar className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-lg font-bold">{program.weeks.length}</p>
          <p className="text-xs text-muted-foreground">{t("program:weeks_count", { count: program.weeks.length })}</p>
        </div>
        <div className="glass p-4 text-center">
          <Dumbbell className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-lg font-bold">{program.weeks.reduce((sum, w) => sum + w.sessions.length, 0)}</p>
          <p className="text-xs text-muted-foreground">{t("program:sessions_count", { count: program.weeks.reduce((sum, w) => sum + w.sessions.length, 0) })}</p>
        </div>
      </div>

      {/* Weeks and sessions */}
      {program.weeks.map(week => (
        <div key={week.id} className="space-y-3">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
            {t("common:days.mon")} — {t("program:weeks_count", { count: week.week_number })}
          </h2>
          {week.sessions.map(session => {
            const isOpen = openSessions.has(session.id);
            const totalExercises = session.sections.reduce((sum, s) => sum + s.exercises.length, 0);
            return (
              <div key={session.id} className="glass overflow-hidden">
                <button
                  onClick={() => toggleSession(session.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{session.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dayLabel(session.day_of_week)} · {totalExercises} {t("program:exercises_count", { count: totalExercises })}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="border-t border-border px-4 pb-4">
                    {session.notes && (
                      <p className="text-xs text-muted-foreground italic py-2">{session.notes}</p>
                    )}
                    {session.sections.map(section => (
                      <div key={section.id} className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.name}</p>
                        <div className="space-y-2">
                          {section.exercises.map((ex, idx) => {
                            const exName = i18n.language === "en" && ex.exercise.name_en ? ex.exercise.name_en : ex.exercise.name;
                            return (
                              <div key={ex.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                                <span className="text-xs font-bold text-muted-foreground min-w-[20px] mt-0.5">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{exName}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    <Badge variant="outline" className="text-[10px] h-5">{ex.sets} × {ex.reps_min}–{ex.reps_max}</Badge>
                                    <Badge variant="outline" className="text-[10px] h-5">{ex.rest_seconds}s {t("common:rest").toLowerCase()}</Badge>
                                    {ex.tempo && <Badge variant="outline" className="text-[10px] h-5">Tempo {ex.tempo}</Badge>}
                                    {ex.rpe_target && <Badge variant="outline" className="text-[10px] h-5">RPE {ex.rpe_target}</Badge>}
                                    {ex.suggested_weight && <Badge variant="outline" className="text-[10px] h-5">{ex.suggested_weight}kg</Badge>}
                                  </div>
                                  {ex.coach_notes && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">{ex.coach_notes}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {session.sections.length === 0 && (
                      <p className="text-sm text-muted-foreground py-3">{t("program:no_programs_desc")}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {program.weeks.length === 0 && (
        <div className="glass p-8 text-center">
          <p className="text-muted-foreground">{t("program:start_with_ai")}</p>
        </div>
      )}
    </div>
  );
};

export default CoachProgramDetail;
