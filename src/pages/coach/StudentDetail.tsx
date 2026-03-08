import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, ClipboardList, Target, BarChart3, ArrowLeftRight, Activity, Bot, BookOpen, Eye, MessageSquare } from "lucide-react";
import AIAdaptationView from "@/components/coach/AIAdaptationView";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import SwapBadge from "@/components/student/SwapBadge";
import { useCoachStudentSwaps } from "@/hooks/useCoachStudentSwaps";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import CoachSuggestion from "@/components/coach/CoachSuggestion";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import { ExternalSessionData } from "@/components/student/ExternalSessionForm";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import ProgramView from "@/components/coach/ProgramView";
import { YANA_PROGRAM } from "@/data/yana-program";
import CoachFeedbackView from "@/components/coach/CoachFeedbackView";

interface StudentProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  goal: string | null;
  level: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
}

interface ProgramInfo {
  id: string;
  name: string;
  status: string;
}

interface CheckinData {
  energy_level: number;
  sleep_quality: number;
  stress_level: number;
  muscle_soreness: number;
  soreness_location: string[] | null;
  availability_notes: string | null;
  general_notes: string | null;
  week_start: string;
}

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "common", "program", "calendar", "settings"]);
  const { user } = useAuth();
  const { startImpersonation } = useImpersonation();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [program, setProgram] = useState<ProgramInfo | null>(null);
  const [checkin, setCheckin] = useState<CheckinData | null>(null);
  const [externals, setExternals] = useState<ExternalSessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachFormOpen, setCoachFormOpen] = useState(false);
  const [coachExternals, setCoachExternals] = useState<ExternalSessionData[]>([]);

  const { swaps, loading: swapsLoading } = useCoachStudentSwaps(studentId);

  useEffect(() => {
    if (!studentId || !user) return;
    fetchStudentData();
  }, [studentId, user]);

  const fetchStudentData = async () => {
    if (!studentId) return;
    setLoading(true);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, goal, level, age, height, weight")
      .eq("user_id", studentId)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      return;
    }
    setStudent(profile);

    // Fetch active program
    const { data: prog } = await supabase
      .from("programs")
      .select("id, name, status")
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();
    setProgram(prog);

    // Fetch this week's check-in
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekStart = monday.toISOString().split("T")[0];

    const { data: ci } = await supabase
      .from("weekly_checkins")
      .select("energy_level, sleep_quality, stress_level, muscle_soreness, soreness_location, availability_notes, general_notes, week_start")
      .eq("student_id", studentId)
      .gte("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCheckin(ci);

    // Fetch external sessions this week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekEnd = sunday.toISOString().split("T")[0];

    const { data: ext } = await supabase
      .from("external_sessions")
      .select("*")
      .eq("student_id", studentId)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date");

    if (ext) {
      setExternals(ext.map(e => ({
        id: e.id,
        activity_type: e.activity_type,
        activity_label: e.activity_label || undefined,
        provider: e.provider || undefined,
        location: e.location || undefined,
        time_start: e.time_start || undefined,
        time_end: e.time_end || undefined,
        duration_minutes: e.duration_minutes || undefined,
        intensity_perceived: e.intensity_perceived || undefined,
        muscle_groups_involved: e.muscle_groups_involved || undefined,
        notes: e.notes || undefined,
        date: e.date,
        added_by: "student" as const,
      })));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("common:student_not_found")}</p>
        <Button variant="ghost" onClick={() => navigate("/coach/students")} className="mt-4">
          {t("common:back")}
        </Button>
      </div>
    );
  }

  const allExternals = [...externals, ...coachExternals];
  const hasProgram = !!program;

  const recentSwaps = swaps.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const dateFmt = i18n.language === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/coach/students")}>
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center text-xl font-semibold text-accent-foreground">
            {student.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{student.full_name}</h1>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  startImpersonation({ id: student.user_id, fullName: student.full_name });
                  navigate("/student");
                }}
              >
                <Eye className="w-3 h-3" strokeWidth={1.5} />
                {t("settings:view_as_student", "Voir comme l'élève")}
              </Button>
              {recentSwaps.length > 0 && (
                <Badge variant="outline" className="text-warning border-warning/30 bg-warning-bg">
                  <ArrowLeftRight className="w-3 h-3 mr-1" strokeWidth={1.5} />
                  {recentSwaps.length} swap{recentSwaps.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {student.goal ? t('dashboard:goals.' + student.goal, student.goal) : '—'} · {student.level ? t('dashboard:levels.' + student.level, student.level) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Check-in section */}
      {checkin && (
        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t("dashboard:week_checkin")}
          </h2>
          <div className="space-y-2">
            <CheckinBadge checkin={checkin} />
            <CoachSuggestion checkin={checkin} />
          </div>
        </div>
      )}
      {!checkin && !loading && (
        <p className="text-sm text-warning">⚠️ {t("dashboard:no_checkin")}</p>
      )}

      {/* Weekly load */}
      <div className="glass p-4">
        <WeeklyLoadBar
          programmedSessions={program ? 1 : 0}
          externalSessions={allExternals}
        />
      </div>

      {/* External sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t("calendar:external_activities_this_week")}</h2>
          <Button size="sm" variant="outline" onClick={() => setCoachFormOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
            {t("common:add")}
          </Button>
        </div>
        {allExternals.length > 0 ? (
          <div className="space-y-2">
            {allExternals.map((ext) => (
              <ExternalSessionCard key={ext.id} session={ext} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("calendar:no_external_activities")}</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <Target className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">{t("dashboard:goal")}</p>
          <p className="text-sm font-semibold mt-0.5">{student.goal ? t('dashboard:goals.' + student.goal, student.goal) : '—'}</p>
        </div>
        <div className="glass p-4 text-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">{t("dashboard:level")}</p>
          <p className="text-sm font-semibold mt-0.5">{student.level ? t('dashboard:levels.' + student.level, student.level) : '—'}</p>
        </div>
        <div className="glass p-4 text-center">
          <ClipboardList className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">{t("program:programs")}</p>
          <p className="text-sm font-semibold mt-0.5">{hasProgram ? "1" : "0"}</p>
        </div>
      </div>

      {/* Swap history */}
      {swaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t("dashboard:swap_history")}
          </h2>
          <div className="space-y-2">
            {swaps.slice(0, 5).map((swap) => (
              <div key={swap.id} className="glass p-3 flex items-center gap-3">
                <SwapBadge originalDay={swap.original_day} newDay={swap.new_day} variant="full" />
                {swap.reason && (
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    — {swap.reason}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(swap.created_at).toLocaleDateString(dateFmt, { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Adaptation */}
      {program && (
        <div className="space-y-3">
          <AIAdaptationView
            studentId={student.user_id}
            programId={program.id}
            weekNumber={1}
            studentName={student.full_name}
          />
        </div>
      )}

      {/* AI Bilan + Report buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate(`/coach/students/${studentId}/bilan`)}
        >
          <Bot className="w-4 h-4 mr-2" />
          {t("program:generate_ai_bilan")}
        </Button>
      </div>

      {/* Coach recommendations for this student */}
      <div className="space-y-3">
        <h2 className="font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          {t("common:recommendations")}
        </h2>
        <StudentRecommendationCards type="all" />
      </div>

      {/* Programs section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{t("program:active_program")}</h2>
          {!hasProgram && (
            <Button size="sm" onClick={() => navigate(`/coach/students/${studentId}/program/new`)}>
              <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              {t("program:new_program")}
            </Button>
          )}
        </div>

        {hasProgram ? (
          <button
            onClick={() => navigate(`/coach/students/${studentId}/program/${program!.id}`)}
            className="w-full glass p-4 text-left hover:bg-secondary/50 transition-colors rounded-xl"
          >
            <h3 className="font-semibold">{program!.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("common:active")} · {t("common:view")} →</p>
          </button>
        ) : (
          <div className="glass p-8 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50 mx-auto" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">{t("program:no_program_for_student")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/coach/students/${studentId}/program/new`)}
            >
              {t("program:create_program")}
            </Button>
          </div>
        )}
      </div>

      {/* Coach add external session form */}
      <ExternalSessionForm
        open={coachFormOpen}
        onClose={() => setCoachFormOpen(false)}
        onSubmit={(data) => {
          setCoachExternals(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
          toast.success(t("calendar:activity_added_for_student"));
        }}
        date={new Date()}
        addedBy="coach"
      />
    </div>
  );
};

export default StudentDetail;
