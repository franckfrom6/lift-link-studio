import { cn } from "@/lib/utils";
import { ACTIVITY_TYPES, ActivityType } from "@/data/activity-types";

interface ActivityTypeSelectorProps {
  value: string;
  onChange: (type: ActivityType) => void;
}

const ActivityTypeSelector = ({ value, onChange }: ActivityTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ACTIVITY_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
            value === type.id
              ? "border-primary bg-accent ring-1 ring-primary/20"
              : "border-border hover:border-primary/30 hover:bg-accent/30"
          )}
        >
          <span className="text-xl">{type.emoji}</span>
          <span className="text-[11px] font-medium">{type.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActivityTypeSelector;
