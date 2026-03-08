import { Users, ClipboardList, Plus, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MOCK_STUDENTS } from "@/types/coach";

const CoachDashboard = () => {
  const navigate = useNavigate();
  const activeStudents = MOCK_STUDENTS.filter((s) => s.status === "active");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bonjour, Coach
        </h1>
        <p className="text-muted-foreground mt-1">Voici un aperçu de votre activité</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">Élèves actifs</span>
          </div>
          <p className="text-3xl font-bold">{activeStudents.length}</p>
        </div>
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">Programmes actifs</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="glass p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-sm font-medium">Séances cette semaine</span>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Recent students */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Élèves récents</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/coach/students")}>
            Voir tous
            <ChevronRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
        <div className="grid gap-3">
          {activeStudents.slice(0, 3).map((student) => (
            <button
              key={student.id}
              onClick={() => navigate(`/coach/students/${student.id}`)}
              className="glass p-4 flex items-center gap-3 w-full text-left hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
                {student.avatar}
              </div>
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
