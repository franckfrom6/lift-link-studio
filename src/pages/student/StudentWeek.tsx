import { Calendar, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const StudentWeek = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    startOfWeek.setDate(diff);

    return DAYS.map((name, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return { name, date, isToday: date.toDateString() === new Date().toDateString() };
    });
  };

  const dates = getWeekDates();

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Salut, <span className="text-gradient">Athlète</span> 💪
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Votre programme de la semaine</p>
      </div>

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

      <div className="space-y-3">
        {dates.map((day) => (
          <div
            key={day.name}
            className={`glass rounded-xl p-4 transition-all ${
              day.isToday ? "ring-2 ring-primary/50 glow-primary" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    day.isToday ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                  }`}
                >
                  {day.date.getDate()}
                </div>
                <div>
                  <p className="font-medium text-sm">{day.name}</p>
                  <p className="text-xs text-muted-foreground">Repos</p>
                </div>
              </div>
              <div className="text-muted-foreground/50">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display font-semibold">Pas encore de programme</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Votre coach n'a pas encore créé de programme pour vous. Contactez-le pour commencer !
        </p>
      </div>
    </div>
  );
};

export default StudentWeek;
