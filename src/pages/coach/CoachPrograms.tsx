import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgramRow {
  id: string;
  name: string;
  status: string;
  student_id: string;
  created_at: string;
  updated_at: string;
  studentName?: string;
  weekCount?: number;
  sessionCount?: number;
}

const CoachPrograms = () => {
  const { t } = useTranslation(["program", "common"]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchPrograms = async () => {
      const { data } = await supabase
        .from("programs")
        .select("*")
        .eq("coach_id", user.id)
        .order("updated_at", { ascending: false });

      if (!data || data.length === 0) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      // Get student names
      const studentIds = [...new Set(data.map(p => p.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", studentIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Get week counts
      const programIds = data.map(p => p.id);
      const { data: weeks } = await supabase
        .from("program_weeks")
        .select("id, program_id")
        .in("program_id", programIds);

      const weekCountMap = new Map<string, number>();
      const weekIds: string[] = [];
      for (const w of (weeks || [])) {
        weekCountMap.set(w.program_id, (weekCountMap.get(w.program_id) || 0) + 1);
        weekIds.push(w.id);
      }

      // Get session counts
      let sessionCountMap = new Map<string, number>();
      if (weekIds.length > 0) {
        const { data: sessions } = await supabase
          .from("sessions")
          .select("id, week_id")
          .in("week_id", weekIds);

        const weekToProg = new Map<string, string>();
        for (const w of (weeks || [])) {
          weekToProg.set(w.id, w.program_id);
        }
        for (const s of (sessions || [])) {
          const progId = weekToProg.get(s.week_id);
          if (progId) sessionCountMap.set(progId, (sessionCountMap.get(progId) || 0) + 1);
        }
      }

      setPrograms(data.map(p => ({
        ...p,
        studentName: nameMap.get(p.student_id) || "—",
        weekCount: weekCountMap.get(p.id) || 0,
        sessionCount: sessionCountMap.get(p.id) || 0,
      })));
      setLoading(false);
    };
    fetchPrograms();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">{t("program:programs")}</h1>
        <p className="text-muted-foreground text-sm">{t("program:create_manage")}</p>
      </div>

      {programs.length === 0 ? (
        <div className="glass p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold">{t("program:no_programs")}</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">{t("program:no_programs_desc")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(prog => (
            <button
              key={prog.id}
              onClick={() => navigate(`/coach/students/${prog.student_id}/program/${prog.id}`)}
              className="w-full glass p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors rounded-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-accent-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{prog.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" strokeWidth={1.5} />
                    {prog.studentName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {prog.weekCount} {t("program:weeks_count", { count: prog.weekCount })}
                    · {prog.sessionCount} {t("program:sessions_count", { count: prog.sessionCount })}
                  </span>
                </div>
              </div>
              <Badge variant={prog.status === "active" ? "default" : "secondary"} className="text-xs shrink-0">
                {t(`program:status.${prog.status}`, prog.status)}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachPrograms;
