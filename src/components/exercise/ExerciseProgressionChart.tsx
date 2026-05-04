import { useMemo } from "react";
import { SessionTopSet } from "@/hooks/useExerciseDetail";

interface Props {
  sessions: SessionTopSet[];
  metric: "e1rm" | "weight";
}

/**
 * Lightweight inline SVG line chart — no recharts dep needed.
 * Shows top-set evolution across sessions (last 12 in 90d).
 */
export function ExerciseProgressionChart({ sessions, metric }: Props) {
  const data = useMemo(() => sessions.map((s) => ({
    date: s.date,
    value: metric === "e1rm" ? s.topSet.e1rm : s.topSet.weight,
  })), [sessions, metric]);

  if (data.length < 2) {
    return (
      <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">
        Pas assez de données — fais au moins 2 séances
      </div>
    );
  }

  const W = 320;
  const H = 160;
  const PAD_X = 12;
  const PAD_Y = 18;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const range = max - min || 1;
  const stepX = (W - PAD_X * 2) / (data.length - 1);

  const points = data.map((d, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_Y + (1 - (d.value - min) / range) * (H - PAD_Y * 2);
    return { x, y, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H - PAD_Y} L ${points[0].x.toFixed(1)} ${H - PAD_Y} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[160px]" role="img" aria-label="Progression du top set">
      <defs>
        <linearGradient id="ex-prog-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line x1={PAD_X} x2={W - PAD_X} y1={H - PAD_Y} y2={H - PAD_Y} stroke="hsl(var(--border))" strokeWidth="1" />
      <path d={areaD} fill="url(#ex-prog-grad)" />
      <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5" />
      ))}
    </svg>
  );
}