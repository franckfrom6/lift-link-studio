import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AIUsageDashboard from "@/components/ai/AIUsageDashboard";
import { Users, TrendingUp, Activity, AlertTriangle, ClipboardList, ChevronRight, Filter, ArrowUpDown, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCoachDashboard, StudentOverview, ActivityItem } from "@/hooks/useCoachDashboard";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const ENERGY_EMOJIS = ["😴", "😪", "😐", "🔋", "⚡"];
const STRESS_EMOJIS = ["😌", "😐", "😰", "😫", "🤯"];
const SORENESS_EMOJIS = ["💪", "😐", "😣", "😖", "🦽"];

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const { students, kpis, feed, loading } = useCoachDashboard();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [alertsOnly, setAlertsOnly] = useState(false);

  const locale = i18n.language === "fr" ? fr : enUS;

  const filtered = students
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => !alertsOnly || s.alerts.filter(a => a !== "swaps").length > 0);

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "adherence":
        return (b.sessionsTotal > 0 ? b.sessionsDone / b.sessionsTotal : 0) - (a.sessionsTotal > 0 ? a.sessionsDone / a.sessionsTotal : 0);
      case "alerts":
        return b.alerts.length - a.alerts.length;
      case "last_session":
        return (b.lastSessionDate || "").localeCompare(a.lastSessionDate || "");
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("dashboard:hello_coach")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard:activity_overview")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <KPICard icon={Users} label={t("dashboard:active_students")} value={kpis.activeStudents} />
        <KPICard icon={Activity} label={t("dashboard:sessions_this_week")} value={kpis.sessionsThisWeek} />
        <KPICard icon={TrendingUp} label={t("dashboard:avg_adherence")} value={`${kpis.avgAdherence}%`} />
        <KPICard icon={AlertTriangle} label={t("dashboard:alerts")} value={kpis.alertCount} variant={kpis.alertCount > 0 ? "warning" : "default"} />
      </div>

      {/* AI Usage */}
      <AIUsageDashboard />

      {/* Student Overview */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">{t("dashboard:my_students")}</h2>
        
        {/* Filters - stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder={t("dashboard:search_student")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-full sm:w-32 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1 shrink-0" strokeWidth={1.5} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("dashboard:sort_name")}</SelectItem>
                <SelectItem value="adherence">{t("dashboard:sort_adherence")}</SelectItem>
                <SelectItem value="alerts">{t("dashboard:sort_alerts")}</SelectItem>
                <SelectItem value="last_session">{t("dashboard:sort_last_session")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={alertsOnly ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs shrink-0"
              onClick={() => setAlertsOnly(!alertsOnly)}
            >
              <Filter className="w-3 h-3 mr-1" strokeWidth={1.5} />
              {t("dashboard:alerts_only")}
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="glass p-8 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{students.length === 0 ? t("dashboard:no_students") : t("dashboard:student_not_found")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((student) => (
              <StudentCard key={student.id} student={student} onClick={() => navigate(`/coach/students/${student.id}`)} locale={locale} t={t} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {feed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            {t("dashboard:recent_activity")}
          </h2>
          <div className="space-y-1.5">
            {feed.map((item) => (
              <FeedItem key={item.id} item={item} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components

const KPICard = ({ icon: Icon, label, value, variant = "default" }: { icon: any; label: string; value: string | number; variant?: "default" | "warning" }) => (
  <div className="glass p-3 sm:p-4 space-y-1">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", variant === "warning" && "text-warning")} strokeWidth={1.5} />
      <span className="text-xs font-medium leading-tight">{label}</span>
    </div>
    <p className={cn("text-xl sm:text-2xl font-bold", variant === "warning" && Number(value) > 0 && "text-warning")}>{value}</p>
  </div>
);

const StudentCard = ({ student, onClick, locale, t }: { student: StudentOverview; onClick: () => void; locale: any; t: any }) => {
  const adherence = student.sessionsTotal > 0 ? Math.round((student.sessionsDone / student.sessionsTotal) * 100) : 0;

  return (
    <button onClick={onClick} className="glass p-3 sm:p-4 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all group">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground shrink-0">
          {student.avatar}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm truncate">{student.name}</span>
            {student.programName && (
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md truncate max-w-[100px] sm:max-w-[140px] hidden sm:inline">
                {student.programName}
              </span>
            )}
          </div>
          {/* Alert badges - wrap on mobile */}
          <div className="flex items-center gap-1 flex-wrap">
            {student.alerts.includes("no_session_5d") && (
              <Badge variant="outline" className="text-[9px] border-warning/40 text-warning bg-warning-bg px-1 py-0">{t("dashboard:alert_no_session")}</Badge>
            )}
            {student.alerts.includes("no_checkin") && (
              <Badge variant="outline" className="text-[9px] border-warning/40 text-warning bg-warning-bg px-1 py-0">{t("dashboard:alert_no_checkin")}</Badge>
            )}
            {student.alerts.includes("high_fatigue") && (
              <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive bg-destructive/10 px-1 py-0">{t("dashboard:alert_fatigue")}</Badge>
            )}
            {student.swapsThisWeek > 0 && (
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary px-1 py-0">🔄 {student.swapsThisWeek}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Adherence bar */}
            <div className="flex items-center gap-1.5 flex-1 max-w-[120px] sm:max-w-[160px]">
              <Progress value={adherence} className="h-1.5" />
              <span className="text-xs font-medium text-muted-foreground">{student.sessionsDone}/{student.sessionsTotal}</span>
            </div>
            {/* Check-in emojis */}
            {student.checkin ? (
              <div className="flex items-center gap-0.5 text-xs">
                <span>{ENERGY_EMOJIS[Math.min(4, Math.max(0, student.checkin.energy - 1))]}</span>
                <span>{STRESS_EMOJIS[Math.min(4, Math.max(0, student.checkin.stress - 1))]}</span>
                <span>{SORENESS_EMOJIS[Math.min(4, Math.max(0, student.checkin.soreness - 1))]}</span>
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground">—</span>
            )}
            {/* Last session - hide on very small screens */}
            {student.lastSessionDate && (
              <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                {formatDistanceToNow(new Date(student.lastSessionDate), { addSuffix: true, locale })}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" strokeWidth={1.5} />
      </div>
    </button>
  );
};

const FEED_ICONS: Record<string, string> = {
  session_completed: "🏋️",
  checkin: "📋",
  swap: "🔄",
  external: "🏃",
};

const FeedItem = ({ item, locale, t }: { item: ActivityItem; locale: any; t: any }) => (
  <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-secondary/50 transition-colors">
    <span className="text-sm">{FEED_ICONS[item.type]}</span>
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0">
      {item.avatar}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs truncate">
        <span className="font-medium">{item.studentName}</span>{" "}
        <span className="text-muted-foreground">
          {item.type === "session_completed" && t("dashboard:feed_session_completed")}
          {item.type === "checkin" && `${t("dashboard:feed_checkin")} ${item.detail}`}
          {item.type === "swap" && t("dashboard:feed_swap")}
          {item.type === "external" && `${t("dashboard:feed_external")} ${item.detail}`}
        </span>
      </p>
    </div>
    <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale })}
    </span>
  </div>
);

export default CoachDashboard;
