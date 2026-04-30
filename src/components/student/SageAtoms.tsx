import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sage atoms — sober, classic UI primitives shared by SessionPreview and LiveSession.
 * Tokens only (bg-card, bg-bg-tinted, text-foreground, text-muted-foreground, text-muted-subtle, border-border).
 * No accent color besides --primary on explicit "accent" prop.
 */

export const Meta = ({
  value,
  unit,
  label,
  border,
  className,
}: {
  value: React.ReactNode;
  unit?: string;
  label: string;
  border?: boolean;
  className?: string;
}) => (
  <div className={cn("text-center px-3", border && "border-x border-border", className)}>
    <div className="text-xl font-bold tabular-nums tracking-tight text-foreground leading-none">
      {value}
      {unit && <span className="text-xs text-muted-subtle ml-0.5 font-medium">{unit}</span>}
    </div>
    <div className="text-[9px] uppercase tracking-[0.12em] font-semibold text-muted-subtle mt-1.5">
      {label}
    </div>
  </div>
);

export const SectionLabel = ({
  label,
  right,
  className,
}: {
  label: string;
  right?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("px-4 pb-2 flex items-center justify-between", className)}>
    <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">
      {label}
    </span>
    {right && (
      <span className="text-[10px] tabular-nums font-medium text-muted-subtle">{right}</span>
    )}
  </div>
);

export const VideoThumb = ({
  hasVideo,
  size = 56,
  onClick,
}: {
  hasVideo: boolean;
  size?: number;
  onClick?: () => void;
}) => {
  // Always render a "playable" thumb. Even without a direct video URL,
  // ExerciseVideoEmbed will fall back to a YouTube search by exercise name.
  const inner = (
    <div
      className={cn(
        "rounded-sm border flex items-center justify-center relative overflow-hidden flex-shrink-0",
        hasVideo
          ? "bg-gradient-to-br from-bg-tinted to-border border-border"
          : "bg-bg-tinted border-border"
      )}
      style={{ width: size, height: size }}
      aria-label={hasVideo ? "Démo disponible" : "Voir la démo"}
    >
      <div className="relative z-10 w-[22px] h-[22px] rounded-full bg-foreground/95 flex items-center justify-center shadow-sm">
        <Play className="w-2.5 h-2.5 text-background ml-[1px]" fill="currentColor" />
      </div>
    </div>
  );
  if (!onClick) return inner;
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
    >
      {inner}
    </button>
  );
};

export const StatBadge = ({
  children,
  accent,
  className,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-medium tabular-nums",
      accent
        ? "bg-primary text-primary-foreground"
        : "bg-bg-tinted text-foreground border border-border",
      className
    )}
  >
    {children}
  </span>
);

export const ExerciseNumber = ({ idx, accent }: { idx: number; accent?: boolean }) => (
  <div
    className={cn(
      "w-6 h-6 rounded-xs flex items-center justify-center text-[11px] font-bold flex-shrink-0 tabular-nums",
      accent
        ? "bg-primary text-primary-foreground"
        : "bg-bg-tinted text-muted-foreground"
    )}
  >
    {idx}
  </div>
);
