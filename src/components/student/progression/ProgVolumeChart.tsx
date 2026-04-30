interface ProgVolumeChartProps {
  title: string;          // e.g. "Volume hebdo"
  unit: string;           // e.g. "kg total"
  current: number;        // raw number — will be displayed as 12.4k
  delta?: string;         // e.g. "+8%"
  points: number[];       // sparkline values
  labelStart: string;     // e.g. "S1"
  labelEnd: string;       // e.g. "S6"
}

/**
 * Sage Progression — sparkline area chart.
 * Uses the foreground token for the line/area, no signature color.
 */
const ProgVolumeChart = ({
  title,
  unit,
  current,
  delta,
  points,
  labelStart,
  labelEnd,
}: ProgVolumeChartProps) => {
  const w = 358;
  const h = 92;
  const padX = 4;
  const padY = 8;
  const safePoints = points.length > 0 ? points : [0, 0];
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const range = max - min || 1;
  const stepX = safePoints.length > 1 ? (w - padX * 2) / (safePoints.length - 1) : 0;
  const pts = safePoints.map((v, i) => {
    const x = padX + i * stepX;
    const y = h - padY - ((v - min) / range) * (h - padY * 2);
    return [x, y] as [number, number];
  });
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L ${w - padX} ${h} L ${padX} ${h} Z`;
  const last = pts[pts.length - 1];

  // Display current as "12.4k" if >= 1000, otherwise as-is
  const displayValue =
    current >= 1000 ? (current / 1000).toFixed(1) : current.toFixed(0);
  const displaySuffix = current >= 1000 ? "k" : "";

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="bg-card border border-border rounded-md px-3.5 pt-3.5 pb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1">
              {title}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[24px] font-bold tabular-nums tracking-tight text-foreground leading-none">
                {displayValue}
                {displaySuffix && (
                  <span className="text-[14px] font-semibold text-muted-subtle">
                    {displaySuffix}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium text-muted-subtle">{unit}</span>
            </div>
          </div>
          {delta && (
            <div className="px-2 py-0.5 bg-success-bg text-success rounded-full text-[10px] font-bold tabular-nums">
              ↑ {delta}
            </div>
          )}
        </div>

        <svg
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          className="block overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="prog-vol-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.10" />
              <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#prog-vol-area)" />
          <path
            d={path}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {last && (
            <circle
              cx={last[0]}
              cy={last[1]}
              r="3.5"
              fill="hsl(var(--card))"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.5"
            />
          )}
        </svg>

        <div className="flex justify-between mt-1.5 text-[9px] font-semibold tabular-nums text-muted-subtle">
          <span>{labelStart}</span>
          <span>{labelEnd}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgVolumeChart;