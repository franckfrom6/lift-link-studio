import { Users, ClipboardList, Plus, TrendingUp, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MOCK_STUDENTS } from "@/types/coach";
import CoachCheckinSummary from "@/components/coach/CoachCheckinSummary";
import { useTranslation } from "react-i18next";

const DEMO_CHECKINS: Record<string, any> = {
  yana: {
    energy_level: 3, sleep_quality: 4, stress_level: 3, muscle_soreness: 4,
    soreness_location: ["jambes"],
    availability_notes: "Dispo mercredi et samedi",
    general_notes: "Beaucoup de Pilates cette semaine, jambes fatiguées",
    week_start: new Date().toISOString().split("T")[0],
  },
};

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'checkin']);
  const activeStudents = MOCK_STUDENTS.filter((s) => s.status === "active");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard:hello_coach')}</h1>
        <p className="text-muted-foreground mt-1">{t('dashboard:activity_overview')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t('dashboard:active_students')}</span>
          </div>
          <p className="text-3xl font-bold">{activeStudents.length}</p>
        </div>
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t('dashboard:active_programs')}</span>
          </div>
          <p className="text-3xl font-bold">1</p>
        </div>
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">{t('dashboard:sessions_this_week')}</span>
          </div>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          {t('checkin:checkins_this_week')}
        </h2>
        <div className="space-y-2">
          {activeStudents.map((student) => (
            <CoachCheckinSummary key={student.id} studentName={student.name} avatar={student.avatar}
              checkin={DEMO_CHECKINS[student.id] || null} onClick={() => navigate(`/coach/students/${student.id}`)} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{t('dashboard:recent_students')}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/coach/students")}>
            {t('common:view_all')}
            <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
        <div className="grid gap-3">
          {activeStudents.slice(0, 3).map((student) => (
            <button key={student.id} onClick={() => navigate(`/coach/students/${student.id}`)}
              className="glass p-4 flex items-center gap-3 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">{student.avatar}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.goal}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{student.level}</Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard;
