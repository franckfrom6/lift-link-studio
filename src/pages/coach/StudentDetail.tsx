import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MOCK_STUDENTS } from "@/types/coach";
import { YANA_PROGRAM } from "@/data/yana-program";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, ClipboardList, Target, BarChart3, ArrowLeftRight, Activity, Bot, FileText } from "lucide-react";
import ProgramView from "@/components/coach/ProgramView";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import SwapBadge from "@/components/student/SwapBadge";
import { useCoachStudentSwaps } from "@/hooks/useCoachStudentSwaps";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import CoachSuggestion from "@/components/coach/CoachSuggestion";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import { ExternalSessionData } from "@/components/student/ExternalSessionForm";
import StudentRecommendationCards from "@/components/student/StudentRecommendationCards";
import { BookOpen } from "lucide-react";

// Demo data for Yana
const DEMO_CHECKIN = {
  energy_level: 3,
  sleep_quality: 4,
  stress_level: 3,
  muscle_soreness: 4,
  soreness_location: ["jambes"],
  availability_notes: "Dispo mercredi et samedi",
  general_notes: "Beaucoup de Pilates cette semaine, jambes fatiguées",
  week_start: new Date().toISOString().split("T")[0],
};

const DEMO_EXTERNALS: ExternalSessionData[] = [
  {
    id: "ext-1",
    activity_type: "pilates",
    activity_label: "Pilates Reformer",
    provider: "Episod",
    location: "Bastille",
    time_start: "12:00",
    time_end: "13:00",
    duration_minutes: 60,
    intensity_perceived: 6,
    muscle_groups_involved: ["core", "glutes", "flexibility"],
    notes: "Beaucoup de travail jambes",
    date: new Date().toISOString().split("T")[0],
    added_by: "student",
  },
  {
    id: "ext-2",
    activity_type: "cycling",
    activity_label: "RPM 45min",
    provider: "CMG",
    location: "Opéra",
    time_start: "18:30",
    time_end: "19:15",
    duration_minutes: 45,
    intensity_perceived: 8,
    muscle_groups_involved: ["quads", "cardio"],
    notes: "",
    date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; })(),
    added_by: "student",
  },
];

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "common", "program", "calendar"]);
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);
  const { swaps, loading: swapsLoading } = useCoachStudentSwaps(studentId === "yana" ? studentId : undefined);
  const [coachFormOpen, setCoachFormOpen] = useState(false);
  const [coachExternals, setCoachExternals] = useState<ExternalSessionData[]>([]);

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

  const hasProgram = studentId === "yana";
  const isYana = studentId === "yana";
  const checkin = isYana ? DEMO_CHECKIN : null;
  const allExternals = isYana ? [...DEMO_EXTERNALS, ...coachExternals] : coachExternals;

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
            {student.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{student.name}</h1>
              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                {student.status === "active" ? t("common:active") : t("common:inactive")}
              </Badge>
              {recentSwaps.length > 0 && (
                <Badge variant="outline" className="text-warning border-warning/30 bg-warning-bg">
                  <ArrowLeftRight className="w-3 h-3 mr-1" strokeWidth={1.5} />
                  {recentSwaps.length} swap{recentSwaps.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{student.goal} · {student.level}</p>
          </div>
        </div>
      </div>

      {/* Check-in section */}
      {isYana && (
        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t("dashboard:week_checkin")}
          </h2>
          {checkin ? (
            <div className="space-y-2">
              <CheckinBadge checkin={checkin} />
              <CoachSuggestion checkin={checkin} />
            </div>
          ) : (
            <p className="text-sm text-warning">⚠️ {t("dashboard:no_checkin")}</p>
          )}
        </div>
      )}

      {/* Weekly load */}
      {isYana && (
        <div className="glass p-4">
          <WeeklyLoadBar
            programmedSessions={1}
            externalSessions={allExternals}
          />
        </div>
      )}

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
          <p className="text-sm font-semibold mt-0.5">{student.goal}</p>
        </div>
        <div className="glass p-4 text-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">{t("dashboard:level")}</p>
          <p className="text-sm font-semibold mt-0.5">{student.level}</p>
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
          <ProgramView program={YANA_PROGRAM} />
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
