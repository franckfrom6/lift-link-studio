interface MacroDonutProps {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calorieTarget: number;
  size?: number;
}

const MacroDonut = ({ protein_g, carbs_g, fat_g, calorieTarget, size = 140 }: MacroDonutProps) => {
  const total = protein_g * 4 + carbs_g * 4 + fat_g * 9;
  const proteinPct = total > 0 ? (protein_g * 4) / total : 0;
  const carbsPct = total > 0 ? (carbs_g * 4) / total : 0;
  const fatPct = total > 0 ? (fat_g * 9) / total : 0;

  const r = 50;
  const circumference = 2 * Math.PI * r;

  const proteinLen = circumference * proteinPct;
  const carbsLen = circumference * carbsPct;
  const fatLen = circumference * fatPct;

  const proteinOffset = 0;
  const carbsOffset = -proteinLen;
  const fatOffset = -(proteinLen + carbsLen);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="12" />
          {/* Protein - blue */}
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="hsl(217 91% 60%)"
            strokeWidth="12"
            strokeDasharray={`${proteinLen} ${circumference - proteinLen}`}
            strokeDashoffset={proteinOffset}
            strokeLinecap="round"
          />
          {/* Carbs - yellow/amber */}
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="hsl(45 93% 47%)"
            strokeWidth="12"
            strokeDasharray={`${carbsLen} ${circumference - carbsLen}`}
            strokeDashoffset={carbsOffset}
            strokeLinecap="round"
          />
          {/* Fat - rose/red */}
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="hsl(0 72% 51%)"
            strokeWidth="12"
            strokeDasharray={`${fatLen} ${circumference - fatLen}`}
            strokeDashoffset={fatOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{calorieTarget}</span>
          <span className="text-[10px] text-muted-foreground">kcal</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(217 91% 60%)" }} />
          <span className="text-muted-foreground">P</span>
          <span className="font-bold">{protein_g}g</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45 93% 47%)" }} />
          <span className="text-muted-foreground">G</span>
          <span className="font-bold">{carbs_g}g</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(0 72% 51%)" }} />
          <span className="text-muted-foreground">L</span>
          <span className="font-bold">{fat_g}g</span>
        </div>
      </div>
    </div>
  );
};

export default MacroDonut;
