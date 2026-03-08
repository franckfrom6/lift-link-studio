import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Play, CheckCircle, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { YANA_PROGRAM } from "@/data/yana-program";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const SESSION_DAY = 3; // Wednesday (0-indexed in our week array)

const StudentWeek = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  const getWeekDates = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    startOfWeek.setDate(diff);

    return DAYS.map((name, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasSession = i === SESSION_DAY;
      const isPast = date < new Date() && !isToday;
      return { name, date, isToday, hasSession, isPast };
    });
  };

  const dates = getWeekDates();
  const totalExercises = YANA_PROGRAM.sections.reduce((a, s) => a + s.exercises.length, 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Salut, <span className="text-gradient">Yana</span> 💪
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Votre programme de la semaine</p>
      </div>

      {/* Current program card */}
      <div className="glass rounded-xl p-4 space-y-3 glow-primary">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-sm">{YANA_PROGRAM.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{YANA_PROGRAM.objective}</p>
          </div>
          <Badge>Actif</Badge>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {YANA_PROGRAM.duration}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Dumbbell className="w-3 h-3" />
            {totalExercises} exercices
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="w-3 h-3" />
            1x/semaine
          </div>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {weekOffset === 0 ? "Cette semaine" : weekOffset === -1 ? "Semaine dernière" : weekOffset === 1 ? "Semaine prochaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(weekOffset + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Days */}
      <div className="space-y-2">
        {dates.map((day, i) => {
          const isSessionDay = day.hasSession;
          const sessionCompleted = isSessionDay && day.isPast && weekOffset < 0;
          const sessionMissed = isSessionDay && day.isPast && weekOffset < 0;

          return (
            <button
              key={day.name}
              onClick={() => isSessionDay && weekOffset === 0 ? navigate("/student/session") : undefined}
              disabled={!isSessionDay}
              className={`w-full glass rounded-xl p-4 transition-all text-left ${
                day.isToday ? "ring-2 ring-primary/50 glow-primary" : ""
              } ${isSessionDay ? "hover:border-primary/30 cursor-pointer" : "opacity-60 cursor-default"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      day.isToday
                        ? "bg-primary text-primary-foreground"
                        : isSessionDay
                        ? "bg-primary/20 text-primary"
                        : "bg-surface text-muted-foreground"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{day.name}</p>
                    {isSessionDay ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-primary">Lower Body — Glutes</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{YANA_PROGRAM.duration}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">Fessiers, Ischios</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Repos</p>
                    )}
                  </div>
                </div>
                <div>
                  {isSessionDay && weekOffset === 0 && !day.isPast ? (
                    <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">
                      <Play className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Go</span>
                    </div>
                  ) : isSessionDay && sessionCompleted ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : !isSessionDay ? (
                    <Calendar className="w-4 h-4 text-muted-foreground/30" />
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StudentWeek;
