import { CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface SessionCreatedCardSession {
  name: string;
  date: string;
  exerciseCount?: number;
}

interface SessionCreatedCardProps {
  sessions: SessionCreatedCardSession[];
  onNavigate?: () => void;
}

const SessionCreatedCard = ({ sessions, onNavigate }: SessionCreatedCardProps) => {
  const navigate = useNavigate();
  const count = sessions.length;

  const handleClick = () => {
    onNavigate?.();
    navigate("/student");
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
        <span>
          {count} séance{count > 1 ? "s" : ""} ajoutée{count > 1 ? "s" : ""} à ton calendrier
        </span>
      </div>
      <ul className="space-y-1.5">
        {sessions.map((s, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 text-[13px] bg-background/60 rounded-lg px-2.5 py-1.5"
          >
            <span className="font-medium truncate">{s.name}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-border/60 text-muted-foreground shrink-0">
              {s.date}
            </span>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-9 gap-2"
        onClick={handleClick}
      >
        <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
        Voir le calendrier
      </Button>
    </div>
  );
};

export default SessionCreatedCard;