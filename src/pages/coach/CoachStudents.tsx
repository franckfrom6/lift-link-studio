import { Users, Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_STUDENTS } from "@/types/coach";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CoachStudents = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'common']);

  const filtered = MOCK_STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard:my_students')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard:student_count', { count: MOCK_STUDENTS.length })}</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          {t('common:invite')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        <Input placeholder={t('dashboard:search_student')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-surface" />
      </div>

      <div className="grid gap-3">
        {filtered.map((student) => (
          <button key={student.id} onClick={() => navigate(`/coach/students/${student.id}`)}
            className="glass p-4 flex items-center gap-4 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-lg font-semibold text-accent-foreground">{student.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{student.name}</p>
                <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {student.status === "active" ? t('common:active') : t('common:inactive')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t('dashboard:goals.' + student.goal, student.goal)} · {t('dashboard:levels.' + student.level, student.level)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoachStudents;
