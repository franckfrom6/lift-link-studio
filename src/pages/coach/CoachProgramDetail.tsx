import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Calendar, Dumbbell, ChevronDown, ChevronUp, Plus, Trash2,
  GripVertical, Check, Pencil, FolderPlus, Loader2, Save
} from "lucide-react";
import { toast } from "sonner";
import ExercisePicker from "@/components/coach/ExercisePicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

// ---- Types ----
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
  video_url: string | null;
  exercise_id: string;
  session_id: string;
  section_id: string | null;
  exercise: { id: string; name: string; name_en: string | null; muscle_group: string; equipment: string };
}

interface Section {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  duration_estimate: string | null;
  notes: string | null;
  session_id: string;
  exercises: SectionExercise[];
}

interface Session {
  id: string;
  name: string;
  day_of_week: number;
  notes: string | null;
  week_id: string;
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
  studentName?: string;
  weeks: Week[];
}

const DAY_KEYS = ["", "mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// ---- Debounced save helper ----
function useDebouncedSave(delay = 600) {
  const timers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const debouncedSave = useCallback((key: string, fn: () => Promise<void>) => {
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(key, setTimeout(async () => {
      setSaving(true);
      setSaved(false);
      try {
        await fn();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        toast.error(t("common:save_error"));
      } finally {
        setSaving(false);
      }
    }, delay));
  }, [delay]);

  return { debouncedSave, saving, saved };
}

// ---- Inline editable number ----
const InlineNumber = ({ value, onChange, min = 0, max = 999, step = 1, className = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; className?: string;
}) => (
  <Input
    type="number"
    value={value}
    onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
    className={`h-7 w-14 text-center text-xs font-semibold bg-surface border-border/50 ${className}`}
    min={min} max={max} step={step}
  />
);

// ---- Inline editable text ----
const InlineText = ({ value, onChange, placeholder = "", className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) => (
  <Input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`h-7 bg-transparent border-none p-0 text-sm focus-visible:ring-0 ${className}`}
  />
);

// ======== MAIN COMPONENT ========
const CoachProgramDetail = () => {
  const { programId, studentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["program", "common", "session", "exercises"]);
  const { user } = useAuth();
  const { debouncedSave, saving, saved } = useDebouncedSave();

  const [program, setProgram] = useState<ProgramFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState("0");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{ sessionId: string; sectionId: string | null }>({ sessionId: "", sectionId: null });

  // Add section dialog
  const [addSectionDialog, setAddSectionDialog] = useState<{ open: boolean; sessionId: string }>({ open: false, sessionId: "" });
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionIcon, setNewSectionIcon] = useState("🏋️");

  // Delete confirmations
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; name: string }>({ open: false, type: "", id: "", name: "" });

  useEffect(() => {
    if (!programId || !user) return;
    fetchProgram();
  }, [programId, user]);

  const fetchProgram = async () => {
    if (!programId) return;
    setLoading(true);

    const { data: prog } = await supabase.from("programs").select("*").eq("id", programId).single();
    if (!prog) { setLoading(false); return; }

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", prog.student_id).maybeSingle();
    const { data: weeks } = await supabase.from("program_weeks").select("*").eq("program_id", prog.id).order("week_number");

    if (!weeks || weeks.length === 0) {
      setProgram({ ...prog, studentName: profile?.full_name, weeks: [] });
      setLoading(false);
      return;
    }

    const weekIds = weeks.map(w => w.id);
    const { data: sessions } = await supabase.from("sessions").select("*").in("week_id", weekIds).order("day_of_week");
    const sessionIds = sessions?.map(s => s.id) || [];

    const { data: sections } = await supabase.from("session_sections").select("*").in("session_id", sessionIds).order("sort_order");
    const { data: exercises } = await supabase.from("session_exercises").select("*, exercise:exercises(id, name, name_en, muscle_group, equipment)").in("session_id", sessionIds).order("sort_order");

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
      sessions: (sessions || []).filter(s => s.week_id === w.id).map(s => ({
        ...s,
        sections: (sections || []).filter(sec => sec.session_id === s.id).map(sec => sectionMap.get(sec.id)!).filter(Boolean),
      })),
    }));

    setProgram({ ...prog, studentName: profile?.full_name, weeks: builtWeeks });
    // Auto-select first session
    const firstSession = builtWeeks[0]?.sessions[0];
    if (firstSession) {
      setActiveSessionId(firstSession.id);
    }
    setLoading(false);
  };

  // ---- UPDATE HELPERS ----
  const updateProgramName = (name: string) => {
    if (!program) return;
    setProgram({ ...program, name });
    debouncedSave(`prog-name-${program.id}`, async () => {
      await supabase.from("programs").update({ name }).eq("id", program.id);
    });
  };

  const updateSessionField = (sessionId: string, field: string, value: any) => {
    if (!program) return;
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s),
        })),
      };
    });
    debouncedSave(`session-${sessionId}-${field}`, async () => {
      await supabase.from("sessions").update({ [field]: value }).eq("id", sessionId);
    });
  };

  const updateSectionField = (sectionId: string, field: string, value: any) => {
    if (!program) return;
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => ({
            ...s,
            sections: s.sections.map(sec => sec.id === sectionId ? { ...sec, [field]: value } : sec),
          })),
        })),
      };
    });
    debouncedSave(`section-${sectionId}-${field}`, async () => {
      await supabase.from("session_sections").update({ [field]: value }).eq("id", sectionId);
    });
  };

  const updateExerciseField = (exerciseId: string, field: string, value: any) => {
    if (!program) return;
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => ({
            ...s,
            sections: s.sections.map(sec => ({
              ...sec,
              exercises: sec.exercises.map(ex => ex.id === exerciseId ? { ...ex, [field]: value } : ex),
            })),
          })),
        })),
      };
    });
    debouncedSave(`exercise-${exerciseId}-${field}`, async () => {
      await supabase.from("session_exercises").update({ [field]: value }).eq("id", exerciseId);
    });
  };

  // ---- ADD / DELETE ----
  const addSection = async (sessionId: string) => {
    if (!newSectionName.trim()) return;
    const session = program?.weeks.flatMap(w => w.sessions).find(s => s.id === sessionId);
    const sortOrder = session?.sections.length || 0;

    const { data, error } = await supabase.from("session_sections").insert({
      session_id: sessionId,
      name: newSectionName,
      icon: newSectionIcon || null,
      sort_order: sortOrder,
    }).select().single();

    if (error) { toast.error(t("common:error")); return; }

    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => s.id === sessionId ? {
            ...s,
            sections: [...s.sections, { ...data, exercises: [] }],
          } : s),
        })),
      };
    });
    setNewSectionName("");
    setNewSectionIcon("🏋️");
    setAddSectionDialog({ open: false, sessionId: "" });
    toast.success(t("common:added"));
  };

  const addExerciseToSection = async (exercise: Exercise) => {
    const { sessionId, sectionId } = pickerTarget;
    const session = program?.weeks.flatMap(w => w.sessions).find(s => s.id === sessionId);
    const section = session?.sections.find(s => s.id === sectionId);
    const sortOrder = section?.exercises.length || 0;

    const { data, error } = await supabase.from("session_exercises").insert({
      session_id: sessionId,
      section_id: sectionId,
      exercise_id: exercise.id,
      sort_order: sortOrder,
      sets: 3,
      reps_min: 8,
      reps_max: 12,
      rest_seconds: 90,
    }).select("*, exercise:exercises(id, name, name_en, muscle_group, equipment)").single();

    if (error) { toast.error(t("common:error")); return; }

    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => s.id === sessionId ? {
            ...s,
            sections: s.sections.map(sec => sec.id === sectionId ? {
              ...sec,
              exercises: [...sec.exercises, data as any],
            } : sec),
          } : s),
        })),
      };
    });
    toast.success(t("common:added"));
  };

  const handleDelete = async () => {
    const { type, id } = deleteDialog;
    if (type === "session") {
      await supabase.from("session_exercises").delete().eq("session_id", id);
      await supabase.from("session_sections").delete().eq("session_id", id);
      await supabase.from("sessions").delete().eq("id", id);
      setProgram(prev => prev ? {
        ...prev,
        weeks: prev.weeks.map(w => ({ ...w, sessions: w.sessions.filter(s => s.id !== id) })),
      } : prev);
    } else if (type === "section") {
      await supabase.from("session_exercises").delete().eq("section_id", id);
      await supabase.from("session_sections").delete().eq("id", id);
      setProgram(prev => prev ? {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => ({ ...s, sections: s.sections.filter(sec => sec.id !== id) })),
        })),
      } : prev);
    } else if (type === "exercise") {
      await supabase.from("session_exercises").delete().eq("id", id);
      setProgram(prev => prev ? {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => ({
            ...s,
            sections: s.sections.map(sec => ({
              ...sec,
              exercises: sec.exercises.filter(ex => ex.id !== id),
            })),
          })),
        })),
      } : prev);
    }
    setDeleteDialog({ open: false, type: "", id: "", name: "" });
    toast.success(t("common:deleted", "Supprimé"));
  };

  const moveExercise = async (sectionId: string, exerciseId: string, direction: -1 | 1) => {
    if (!program) return;
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => ({
            ...s,
            sections: s.sections.map(sec => {
              if (sec.id !== sectionId) return sec;
              const exs = [...sec.exercises];
              const idx = exs.findIndex(e => e.id === exerciseId);
              const target = idx + direction;
              if (target < 0 || target >= exs.length) return sec;
              [exs[idx], exs[target]] = [exs[target], exs[idx]];
              exs.forEach((e, i) => { e.sort_order = i; });
              // Save sort orders
              exs.forEach(e => {
                supabase.from("session_exercises").update({ sort_order: e.sort_order }).eq("id", e.id);
              });
              return { ...sec, exercises: exs };
            }),
          })),
        })),
      };
    });
  };

  const moveSection = async (sessionId: string, sectionId: string, direction: -1 | 1) => {
    if (!program) return;
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => ({
          ...w,
          sessions: w.sessions.map(s => {
            if (s.id !== sessionId) return s;
            const secs = [...s.sections];
            const idx = secs.findIndex(sec => sec.id === sectionId);
            const target = idx + direction;
            if (target < 0 || target >= secs.length) return s;
            [secs[idx], secs[target]] = [secs[target], secs[idx]];
            secs.forEach((sec, i) => { sec.sort_order = i; });
            secs.forEach(sec => {
              supabase.from("session_sections").update({ sort_order: sec.sort_order }).eq("id", sec.id);
            });
            return { ...s, sections: secs };
          }),
        })),
      };
    });
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const addSessionToDay = async (weekId: string, dayOfWeek: number) => {
    if (!program) return;
    const dayName = dayLabel(dayOfWeek);
    const name = t("program:session_default_name", { day: dayName });
    const { data, error } = await supabase.from("sessions").insert({
      week_id: weekId,
      day_of_week: dayOfWeek,
      name,
    }).select().single();
    if (error || !data) { toast.error(t("common:error")); return; }
    setProgram(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeks: prev.weeks.map(w => w.id === weekId ? {
          ...w,
          sessions: [...w.sessions, { ...data, sections: [] }].sort((a, b) => a.day_of_week - b.day_of_week),
        } : w),
      };
    });
    setActiveSessionId(data.id);
    toast.success(t("common:added"));
  };

  const activateProgram = async () => {
    if (!program) return;
    await supabase.from("programs").update({ status: "active" }).eq("id", program.id);
    setProgram(prev => prev ? { ...prev, status: "active" } : prev);
    toast.success(t("program:program_activated"));
  };

  // ---- RENDER ----
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
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
  const lang = i18n.language;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex-1 min-w-0">
          <InlineText
            value={program.name}
            onChange={(v) => updateProgramName(v)}
            placeholder={t("program:program_name_placeholder")}
            className="font-bold text-xl"
          />
          <div className="flex items-center gap-2 mt-1">
            {program.studentName && <span className="text-sm text-muted-foreground">{program.studentName}</span>}
            <Badge variant={program.status === "active" ? "default" : "secondary"} className="text-xs">
              {t(`program:status.${program.status}`, program.status)}
            </Badge>
            {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            {saved && <span className="text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> {t("common:saved", "Sauvegardé")}</span>}
          </div>
        </div>
        {program.status === "draft" && (
          <Button size="sm" onClick={activateProgram}>
            {t("program:activate_program")}
          </Button>
        )}
      </div>

      {/* Weeks tabs */}
      {program.weeks.length > 0 && (
        <Tabs value={activeWeek} onValueChange={(v) => {
          setActiveWeek(v);
          const weekIdx = Number(v);
          const firstSession = program.weeks[weekIdx]?.sessions[0];
          setActiveSessionId(firstSession?.id || null);
        }}>
          <TabsList className="bg-surface">
            {program.weeks.map((w, i) => (
              <TabsTrigger key={w.id} value={String(i)} className="text-xs">
                S{w.week_number}
              </TabsTrigger>
            ))}
          </TabsList>

          {program.weeks.map((week, wi) => (
            <TabsContent key={week.id} value={String(wi)} className="space-y-4 mt-4">
              {/* Mini weekly calendar — day tabs */}
              <div className="grid grid-cols-7 gap-1.5 p-3 bg-secondary/20 rounded-xl border border-border/50">
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const session = week.sessions.find(s => s.day_of_week === day);
                  const hasSession = !!session;
                  const isActive = session?.id === activeSessionId;
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        if (session) setActiveSessionId(session.id);
                        else addSessionToDay(week.id, day);
                      }}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-center min-h-[60px] ${
                        isActive
                          ? "bg-accent border-2 border-accent-foreground/30 shadow-sm"
                          : hasSession
                            ? "bg-accent/40 border border-accent-foreground/15 hover:bg-accent/60 cursor-pointer"
                            : "bg-background/50 border border-dashed border-border hover:bg-accent/20 hover:border-accent cursor-pointer group"
                      }`}
                    >
                      <span className={`text-[10px] font-semibold uppercase ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`}>
                        {dayLabel(day).slice(0, 3)}
                      </span>
                      {hasSession ? (
                        <span className={`text-[10px] font-medium leading-tight line-clamp-2 ${isActive ? "text-accent-foreground" : "text-accent-foreground/70"}`}>
                          {session.name}
                        </span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-accent-foreground/60 transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected session content */}
              {(() => {
                const session = week.sessions.find(s => s.id === activeSessionId);
                if (!session && week.sessions.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-8">{t("program:start_with_ai")}</p>;
                }
                if (!session) {
                  return <p className="text-sm text-muted-foreground text-center py-8">{t("common:select_session")}</p>;
                }

                const totalExercises = session.sections.reduce((sum, s) => sum + s.exercises.length, 0);

                return (
                  <div className="border border-border rounded-xl overflow-hidden animate-fade-in">
                    {/* Session header */}
                    <div className="flex items-center gap-3 p-4 bg-secondary/30">
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-accent-foreground">
                        {dayLabel(session.day_of_week).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <InlineText
                          value={session.name}
                          onChange={(v) => updateSessionField(session.id, "name", v)}
                          className="font-semibold"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {dayLabel(session.day_of_week)} · {totalExercises} {t("program:exercises_count", { count: totalExercises })} · {session.sections.length} sections
                        </p>
                      </div>
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: "session", id: session.id, name: session.name })}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Session content */}
                    <div className="p-4 space-y-4">
                      {/* Session notes */}
                      <Input
                        value={session.notes || ""}
                        onChange={(e) => updateSessionField(session.id, "notes", e.target.value || null)}
                        placeholder={t("exercises:coach_notes", "Notes de séance...")}
                        className="h-8 bg-transparent border-dashed text-xs italic"
                      />

                      {/* Sections */}
                      {session.sections.map((section, si) => (
                        <div key={section.id} className="border border-border/60 rounded-lg overflow-hidden bg-muted/20">
                          {/* Section header */}
                          <div className="flex items-center gap-2 p-3 bg-muted/30">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveSection(session.id, section.id, -1)} disabled={si === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => moveSection(session.id, section.id, 1)} disabled={si === session.sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                            <Input
                              value={section.icon || ""}
                              onChange={(e) => updateSectionField(section.id, "icon", e.target.value || null)}
                              className="w-10 h-7 text-center bg-transparent border-none p-0 text-sm focus-visible:ring-0"
                              placeholder="🏋️"
                            />
                            <InlineText
                              value={section.name}
                              onChange={(v) => updateSectionField(section.id, "name", v)}
                              className="font-semibold flex-1"
                            />
                            <Input
                              value={section.duration_estimate || ""}
                              onChange={(e) => updateSectionField(section.id, "duration_estimate", e.target.value || null)}
                              placeholder="10 min"
                              className="w-16 h-7 text-center bg-surface text-[11px] border-border/50"
                            />
                            <button
                              onClick={() => setDeleteDialog({ open: true, type: "section", id: section.id, name: section.name })}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </div>

                          {/* Section notes */}
                          <div className="px-3 pt-2">
                            <Input
                              value={section.notes || ""}
                              onChange={(e) => updateSectionField(section.id, "notes", e.target.value || null)}
                              placeholder="Notes de section..."
                              className="h-7 bg-transparent border-dashed text-xs italic"
                            />
                          </div>

                          {/* Exercises */}
                          <div className="p-3 space-y-2">
                            {section.exercises.map((ex, ei) => {
                              const exName = lang === "en" && ex.exercise.name_en ? ex.exercise.name_en : ex.exercise.name;
                              return (
                                <div key={ex.id} className="bg-background border border-border/40 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-0.5">
                                      <button onClick={() => moveExercise(section.id, ex.id, -1)} disabled={ei === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => moveExercise(section.id, ex.id, 1)} disabled={ei === section.exercises.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20">
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center shrink-0">
                                      <Dumbbell className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">{exName}</p>
                                      <p className="text-[10px] text-muted-foreground">{ex.exercise.muscle_group} · {ex.exercise.equipment}</p>
                                    </div>
                                    <button
                                      onClick={() => setDeleteDialog({ open: true, type: "exercise", id: ex.id, name: exName })}
                                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                    </button>
                                  </div>

                                  {/* Inline prescription editing */}
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase">{t("session:sets")}</span>
                                      <InlineNumber value={ex.sets} onChange={(v) => updateExerciseField(ex.id, "sets", v)} min={1} max={20} />
                                    </div>
                                    <span className="text-muted-foreground text-xs">×</span>
                                    <div className="flex items-center gap-1">
                                      <InlineNumber value={ex.reps_min} onChange={(v) => updateExerciseField(ex.id, "reps_min", v)} min={1} max={100} />
                                      <span className="text-muted-foreground text-xs">–</span>
                                      <InlineNumber value={ex.reps_max} onChange={(v) => updateExerciseField(ex.id, "reps_max", v)} min={1} max={100} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase">Repos</span>
                                      <InlineNumber value={ex.rest_seconds} onChange={(v) => updateExerciseField(ex.id, "rest_seconds", v)} min={0} max={600} step={15} className="w-16" />
                                      <span className="text-[10px] text-muted-foreground">s</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 items-center">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase">Tempo</span>
                                      <Input
                                        value={ex.tempo || ""}
                                        onChange={(e) => updateExerciseField(ex.id, "tempo", e.target.value || null)}
                                        placeholder="2-0-1-0"
                                        className="h-7 w-20 text-center text-xs bg-surface border-border/50"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase">RPE</span>
                                      <Input
                                        value={ex.rpe_target || ""}
                                        onChange={(e) => updateExerciseField(ex.id, "rpe_target", e.target.value || null)}
                                        placeholder="8"
                                        className="h-7 w-14 text-center text-xs bg-surface border-border/50"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-muted-foreground uppercase">Kg</span>
                                      <Input
                                        type="number"
                                        value={ex.suggested_weight ?? ""}
                                        onChange={(e) => updateExerciseField(ex.id, "suggested_weight", e.target.value ? Number(e.target.value) : null)}
                                        placeholder="—"
                                        className="h-7 w-16 text-center text-xs bg-surface border-border/50"
                                      />
                                    </div>
                                  </div>

                                  {/* Coach notes */}
                                  <Input
                                    value={ex.coach_notes || ""}
                                    onChange={(e) => updateExerciseField(ex.id, "coach_notes", e.target.value || null)}
                                    placeholder={t("exercises:coach_notes", "Notes coach...")}
                                    className="h-7 bg-transparent border-dashed text-[11px] italic text-muted-foreground"
                                  />
                                </div>
                              );
                            })}

                            {/* Add exercise button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-muted-foreground text-xs"
                              onClick={() => { setPickerTarget({ sessionId: session.id, sectionId: section.id }); setPickerOpen(true); }}
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              {t("common:add")} {t("exercises:exercise", "exercice").toLowerCase()}
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add section button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setAddSectionDialog({ open: true, sessionId: session.id })}
                      >
                        <FolderPlus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        {t("common:add")} section
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {program.weeks.length === 0 && (
        <div className="border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">{t("program:start_with_ai")}</p>
        </div>
      )}

      {/* Exercise Picker Dialog */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(ex) => addExerciseToSection(ex)}
        excludeIds={[]}
      />

      {/* Add Section Dialog */}
      <Dialog open={addSectionDialog.open} onOpenChange={(o) => !o && setAddSectionDialog({ open: false, sessionId: "" })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common:add")} section</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSectionIcon}
                onChange={(e) => setNewSectionIcon(e.target.value)}
                placeholder="🏋️"
                className="w-14 text-center"
              />
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Nom de la section (ex: Warm-up, Bloc A...)"
                className="flex-1"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addSection(addSectionDialog.sessionId)} disabled={!newSectionName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              {t("common:add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, type: "", id: "", name: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common:confirm_delete", "Confirmer la suppression")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common:delete_confirm_msg", "Supprimer « {{name}} » ? Cette action est irréversible.").replace("{{name}}", deleteDialog.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:cancel", "Annuler")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common:delete", "Supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoachProgramDetail;