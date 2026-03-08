import { useParams, useNavigate } from "react-router-dom";
import { MOCK_STUDENTS } from "@/types/coach";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, ClipboardList, Target, BarChart3 } from "lucide-react";

const StudentDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const student = MOCK_STUDENTS.find((s) => s.id === studentId);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/coach/students")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
            {student.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold">{student.name}</h1>
              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                {student.status === "active" ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{student.goal} · {student.level}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Objectif</p>
          <p className="text-sm font-semibold mt-0.5">{student.goal}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Niveau</p>
          <p className="text-sm font-semibold mt-0.5">{student.level}</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <ClipboardList className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Programmes</p>
          <p className="text-sm font-semibold mt-0.5">0</p>
        </div>
      </div>

      {/* Programs section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold">Programmes</h2>
          <Button size="sm" onClick={() => navigate(`/coach/students/${studentId}/program/new`)}>
            <Plus className="w-4 h-4 mr-1" />
            Nouveau programme
          </Button>
        </div>

        <div className="glass rounded-xl p-8 text-center space-y-3">
          <ClipboardList className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-muted-foreground text-sm">Aucun programme pour cet élève</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/coach/students/${studentId}/program/new`)}
          >
            Créer le premier programme
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
