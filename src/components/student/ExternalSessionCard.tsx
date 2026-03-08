import { Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES, getIntensityColor, MUSCLE_GROUP_LABELS } from "@/data/activity-types";
import { ExternalSessionData } from "./ExternalSessionForm";

interface ExternalSessionCardProps {
  session: ExternalSessionData;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const ExternalSessionCard = ({ session, onEdit, onDelete, compact }: ExternalSessionCardProps) => {
  const type = ACTIVITY_TYPES.find(t => t.id === session.activity_type);
  const emoji = type?.emoji || "➕";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <span>{emoji}</span>
        <span className="font-medium truncate">{session.activity_label || type?.label}</span>
        {session.duration_minutes && (
          <span className="text-muted-foreground">{session.duration_minutes}'</span>
        )}
        {session.intensity_perceived && (
          <span className={cn("font-bold", getIntensityColor(session.intensity_perceived))}>
            {session.intensity_perceived}/10
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-dashed border-border bg-surface/50">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-xs truncate">
            {session.activity_label || type?.label}
          </p>
          {session.provider && (
            <span className="text-[10px] text-muted-foreground">· {session.provider}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {session.duration_minutes && (
            <span className="text-[10px] text-muted-foreground">{session.duration_minutes} min</span>
          )}
          {session.intensity_perceived && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className={cn("text-[10px] font-bold", getIntensityColor(session.intensity_perceived))}>
                RPE {session.intensity_perceived}
              </span>
            </>
          )}
        </div>
        {session.muscle_groups_involved.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {session.muscle_groups_involved.slice(0, 3).map(g => (
              <span key={g} className="bg-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[9px]">
                {MUSCLE_GROUP_LABELS[g] || g}
              </span>
            ))}
          </div>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Pencil className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalSessionCard;
