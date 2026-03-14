import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AIUsageDashboard from "@/components/ai/AIUsageDashboard";
import { Users, TrendingUp, Activity, AlertTriangle, ChevronRight, Filter, ArrowUpDown, Search, Clock, Zap, Target, Pin, PinOff } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ENERGY_EMOJIS = ["😴", "😪", "😐", "🔋", "⚡"];
const STRESS_EMOJIS = ["😌", "😐", "😰", "😫", "🤯"];
const SORENESS_EMOJIS = ["💪", "😐", "😣", "😖", "🦽"];

type KanbanColumn = "needs_attention" | "in_progress" | "on_track" | "inactive";

function categorizeStudent(s: StudentOverview): KanbanColumn {
  const hasAlerts = s.alerts.filter(a => a !== "swaps").length > 0;
  const adherence = s.sessionsTotal > 0 ? s.sessionsDone / s.sessionsTotal : 0;
  if (s.alerts.includes("no_session_5d") && !s.lastSessionDate) return "inactive";
  if (hasAlerts || (s.checkin && (s.checkin.energy <= 2 || s.checkin.stress >= 4))) return "needs_attention";
  if (adherence > 0 && adherence < 1) return "in_progress";
  if (adherence >= 1 || s.sessionsDone > 0) return "on_track";
  return "inactive";
}

const COLUMN_CONFIG: Record<KanbanColumn, { label: string; color: string; bgColor: string }> = {
  needs_attention: { label: "Needs Attention", color: "text-destructive", bgColor: "bg-danger-bg" },
  in_progress: { label: "In Progress", color: "text-warning", bgColor: "bg-warning-bg" },
  on_track: { label: "On Track", color: "text-success", bgColor: "bg-success-bg" },
  inactive: { label: "Inactive", color: "text-muted-foreground", bgColor: "bg-secondary" },
};

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "common"]);
  const { students, kpis, feed, loading } = useCoachDashboard();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [sortBy, setSortBy] = useState<string>("name");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const locale = i18n.language === "fr" ? fr : enUS;

  // Pinned students
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("coach_pinned_students") || "[]"); } catch { return []; }
  });
  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem("coach_pinned_students", JSON.stringify(next));
      return next;
    });
  };

  const filtered = students
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => !alertsOnly || s.alerts.filter(a => a !== "swaps").length > 0);

  const sorted = [...filtered].sort((a, b) => {
    // Pinned first
    const aPinned = pinnedIds.includes(a.id) ? 0 : 1;
    const bPinned = pinnedIds.includes(b.id) ? 0 : 1;
    if (aPinned !== bPinned) return aPinned - bPinned;
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

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    const cols: Record<KanbanColumn, StudentOverview[]> = {
      needs_attention: [], in_progress: [], on_track: [], inactive: [],
    };
    filtered.forEach(s => {
      cols[categorizeStudent(s)].push(s);
    });
    return cols;
  }, [filtered]);

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("dashboard:hello_coach")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dashboard:activity_overview")}</p>
        </div>
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{t('dashboard:search_student')}</span>
          <kbd className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <KPICard icon={Users} label={t("dashboard:active_students")} value={kpis.activeStudents} />
        <KPICard icon={Activity} label={t("dashboard:sessions_this_week")} value={kpis.sessionsThisWeek} />
        <KPICard icon={TrendingUp} label={t("dashboard:avg_adherence")} value={`${kpis.avgAdherence}%`} />
        <KPICard icon={AlertTriangle} label={t("dashboard:alerts")} value={kpis.alertCount} variant={kpis.alertCount > 0 ? "warning" : "default"} />
      </div>

      <AIUsageDashboard />

      {/* Student Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{t("dashboard:my_students")}</h2>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "kanban")}>
            <TabsList className="h-8">
              <TabsTrigger value="list" className="text-xs px-3 h-7">{t("common:list", "Liste")}</TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs px-3 h-7">Kanban</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input placeholder={t("dashboard:search_student")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
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
            <Button variant={alertsOnly ? "default" : "outline"} size="sm" className="h-9 text-xs shrink-0" onClick={() => setAlertsOnly(!alertsOnly)}>
              <Filter className="w-3 h-3 mr-1" strokeWidth={1.5} />
              {t("dashboard:alerts_only")}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {sorted.length === 0 ? (
                <div className="glass p-8 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">{students.length === 0 ? t("dashboard:no_students") : t("dashboard:student_not_found")}</p>
                </div>
              ) : (
                sorted.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={() => navigate(`/coach/students/${student.id}`)}
                    locale={locale}
                    t={t}
                    isPinned={pinnedIds.includes(student.id)}
                    onTogglePin={() => togglePin(student.id)}
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {(Object.keys(COLUMN_CONFIG) as KanbanColumn[]).map((col) => (
                <div key={col} className="space-y-2">
                  <div className={cn("flex items-center justify-between px-3 py-2 rounded-lg", COLUMN_CONFIG[col].bgColor)}>
                    <span className={cn("text-xs font-semibold", COLUMN_CONFIG[col].color)}>
                      {t(`dashboard:kanban_${col}`, COLUMN_CONFIG[col].label)}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-5">{kanbanColumns[col].length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {kanbanColumns[col].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/coach/students/${s.id}`)}
                        className="glass p-3 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
                            {s.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-xs truncate">{s.name}</span>
                              <DisplayModeIcon mode={s.displayMode} />
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Progress value={s.sessionsTotal > 0 ? (s.sessionsDone / s.sessionsTotal) * 100 : 0} className="h-1 flex-1 max-w-[60px]" />
                              <span className="text-[10px] text-muted-foreground">{s.sessionsDone}/{s.sessionsTotal}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    {kanbanColumns[col].length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">—</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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

// Display mode icon
const DisplayModeIcon = ({ mode }: { mode: "simple" | "advanced" | null }) => {
  const isAdvanced = mode === "advanced";
  return (
    <span title={isAdvanced ? "Mode Pro" : "Mode Simple"} className="shrink-0">
      {isAdvanced ? (
        <Zap className="w-3 h-3 text-primary" strokeWidth={2} />
      ) : (
        <Target className="w-3 h-3 text-muted-foreground" strokeWidth={2} />
      )}
    </span>
  );
};

// KPI Card
const KPICard = ({ icon: Icon, label, value, variant = "default" }: { icon: any; label: string; value: string | number; variant?: "default" | "warning" }) => (
  <div className="glass p-3 sm:p-4 space-y-1">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0", variant === "warning" && "text-warning")} strokeWidth={1.5} />
      <span className="text-xs font-medium leading-tight">{label}</span>
    </div>
    <p className={cn("text-xl sm:text-2xl font-bold", variant === "warning" && Number(value) > 0 && "text-warning")}>{value}</p>
  </div>
);

// Student Card
const StudentCard = ({ student, onClick, locale, t, isPinned, onTogglePin }: {
  student: StudentOverview; onClick: () => void; locale: any; t: any; isPinned: boolean; onTogglePin: () => void;
}) => {
  const adherence = student.sessionsTotal > 0 ? Math.round((student.sessionsDone / student.sessionsTotal) * 100) : 0;

  return (
    <div className="glass w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all group flex">
      <button onClick={onClick} className="flex-1 p-3 sm:p-4 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground shrink-0">
            {student.avatar}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm truncate">{student.name}</span>
              <DisplayModeIcon mode={student.displayMode} />
              {student.programName && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md truncate max-w-[100px] sm:max-w-[140px] hidden sm:inline">
                  {student.programName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {student.alerts.includes("no_session_5d") && (
                <Badge variant="outline" className="text-xs border-warning/40 text-warning bg-warning-bg px-1.5 py-0.5">{t("dashboard:alert_no_session")}</Badge>
              )}
              {student.alerts.includes("no_checkin") && (
                <Badge variant="outline" className="text-xs border-warning/40 text-warning bg-warning-bg px-1.5 py-0.5">{t("dashboard:alert_no_checkin")}</Badge>
              )}
              {student.alerts.includes("high_fatigue") && (
                <Badge variant="outline" className="text-xs border-destructive/40 text-destructive bg-destructive/10 px-1.5 py-0.5">{t("dashboard:alert_fatigue")}</Badge>
              )}
              {student.swapsThisWeek > 0 && (
                <Badge variant="outline" className="text-xs border-primary/30 text-primary px-1.5 py-0.5">🔄 {student.swapsThisWeek}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 flex-1 max-w-[120px] sm:max-w-[160px]">
                <Progress value={adherence} className="h-1.5" />
                <span className="text-xs font-medium text-muted-foreground">{student.sessionsDone}/{student.sessionsTotal}</span>
              </div>
              {student.checkin ? (
                <div className="flex items-center gap-0.5 text-xs">
                  <span>{ENERGY_EMOJIS[Math.min(4, Math.max(0, student.checkin.energy - 1))]}</span>
                  <span>{STRESS_EMOJIS[Math.min(4, Math.max(0, student.checkin.stress - 1))]}</span>
                  <span>{SORENESS_EMOJIS[Math.min(4, Math.max(0, student.checkin.soreness - 1))]}</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {student.lastSessionDate && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  {formatDistanceToNow(new Date(student.lastSessionDate), { addSuffix: true, locale })}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" strokeWidth={1.5} />
        </div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className="px-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border-l border-border"
        title={isPinned ? "Unpin" : "Pin"}
      >
        {isPinned ? <PinOff className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Pin className="w-3.5 h-3.5" strokeWidth={1.5} />}
      </button>
    </div>
  );
};

// Feed Item
const FEED_ICONS: Record<string, string> = {
  session_completed: "🏋️", checkin: "📋", swap: "🔄", external: "🏃",
};

const FeedItem = ({ item, locale, t }: { item: ActivityItem; locale: any; t: any }) => (
  <div className="flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3 rounded-lg hover:bg-secondary/50 transition-colors">
    <span className="text-sm">{FEED_ICONS[item.type]}</span>
    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-accent flex items-center justify-center text-xs font-semibold text-accent-foreground shrink-0">
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
    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale })}
    </span>
  </div>
);

export default CoachDashboard;
