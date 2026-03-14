import { Users, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCoachDashboard } from "@/hooks/useCoachDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import InviteClientModal from "@/components/InviteClientModal";
import CoachInviteToken from "@/components/coach/CoachInviteToken";
import CoachNotifyModal from "@/components/coach/CoachNotifyModal";

const CoachStudents = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'common']);
  const { students, loading } = useCoachDashboard();

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard:my_students')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard:student_count', { count: students.length })}</p>
        </div>
        <InviteClientModal />
      </div>

      <CoachInviteToken />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <Input placeholder={t('dashboard:search_student')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-surface" />
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{search ? t('common:no_results') : t('dashboard:no_students')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((student) => (
            <button key={student.id} onClick={() => navigate(`/coach/students/${student.id}`)}
              className="glass p-4 flex items-center gap-4 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-lg font-semibold text-accent-foreground">{student.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{student.name}</p>
                  {student.alerts.length > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {student.alerts.length} {t('common:alert', { count: student.alerts.length })}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student.goal ? t('dashboard:goals.' + student.goal, student.goal) : '—'} · {student.level ? t('dashboard:levels.' + student.level, student.level) : '—'}
                </p>
                {student.programName && (
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{student.programName}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachStudents;
