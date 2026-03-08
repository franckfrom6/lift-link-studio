import { Users, Plus, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_STUDENTS } from "@/types/coach";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CoachStudents = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = MOCK_STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Mes Élèves</h1>
          <p className="text-muted-foreground text-sm">{MOCK_STUDENTS.length} élèves</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Inviter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-surface"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((student) => (
          <button
            key={student.id}
            onClick={() => navigate(`/coach/students/${student.id}`)}
            className="glass rounded-xl p-4 flex items-center gap-4 w-full text-left hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
              {student.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{student.name}</p>
                <Badge variant={student.status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {student.status === "active" ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {student.goal} · {student.level}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoachStudents;
