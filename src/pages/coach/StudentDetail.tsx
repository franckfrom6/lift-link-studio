import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MOCK_STUDENTS } from "@/types/coach";
import { YANA_PROGRAM } from "@/data/yana-program";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, ClipboardList, Target, BarChart3, ArrowLeftRight, Activity } from "lucide-react";
import ProgramView from "@/components/coach/ProgramView";
import ExternalSessionForm from "@/components/student/ExternalSessionForm";
import SwapBadge from "@/components/student/SwapBadge";
import { useCoachStudentSwaps } from "@/hooks/useCoachStudentSwaps";
import CheckinBadge from "@/components/student/CheckinBadge";
import WeeklyLoadBar from "@/components/student/WeeklyLoadBar";
import CoachSuggestion from "@/components/coach/CoachSuggestion";
import ExternalSessionCard from "@/components/student/ExternalSessionCard";
import { ExternalSessionData } from "@/components/student/ExternalSessionForm";

const DAY_NAMES: Record<number, string> = {
  1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi", 7: "Dimanche",
};

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
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);
  const { swaps, loading: swapsLoading } = useCoachStudentSwaps(studentId === "yana" ? studentId : undefined);
  const [coachFormOpen, setCoachFormOpen] = useState(false);
  const [coachExternals, setCoachExternals] = useState<ExternalSessionData[]>([]);

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Élève introuvable</p>
        <Button variant="ghost" onClick={() => navigate("/coach/students")} className="mt-4">
          Retour
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
                {student.status === "active" ? "Actif" : "Inactif"}
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
            Check-in de la semaine
          </h2>
          {checkin ? (
            <div className="space-y-2">
              <CheckinBadge checkin={checkin} />
              <CoachSuggestion checkin={checkin} />
            </div>
          ) : (
            <p className="text-sm text-warning">⚠️ Pas de check-in cette semaine</p>
          )}
        </div>
      )}

      {/* Weekly load */}
      {isYana && (
        <div className="glass p-4">
          <WeeklyLoadBar
            programmedSessions={1}
            externalSessions={externals}
          />
        </div>
      )}

      {/* External sessions */}
      {externals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold">Activités externes cette semaine</h2>
          <div className="space-y-2">
            {externals.map((ext) => (
              <ExternalSessionCard key={ext.id} session={ext} />
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <Target className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">Objectif</p>
          <p className="text-sm font-semibold mt-0.5">{student.goal}</p>
        </div>
        <div className="glass p-4 text-center">
          <BarChart3 className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">Niveau</p>
          <p className="text-sm font-semibold mt-0.5">{student.level}</p>
        </div>
        <div className="glass p-4 text-center">
          <ClipboardList className="w-5 h-5 text-muted-foreground mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">Programmes</p>
          <p className="text-sm font-semibold mt-0.5">{hasProgram ? "1" : "0"}</p>
        </div>
      </div>

      {/* Swap history */}
      {swaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            Historique des déplacements
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
                  {new Date(swap.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Programs section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Programme actif</h2>
          {!hasProgram && (
            <Button size="sm" onClick={() => navigate(`/coach/students/${studentId}/program/new`)}>
              <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              Nouveau programme
            </Button>
          )}
        </div>

        {hasProgram ? (
          <ProgramView program={YANA_PROGRAM} />
        ) : (
          <div className="glass p-8 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50 mx-auto" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">Aucun programme pour cet élève</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/coach/students/${studentId}/program/new`)}
            >
              Créer le premier programme
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetail;
