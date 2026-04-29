import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SignatureHeaderProps {
  userName: string;
  programName?: string;
  weekIndex: number;
  totalWeeks: number;
  /** Per-day completion state in week order (Mon..Sun). "rest" days are filtered out. */
  weekDays: { state: "done" | "today" | "planned" | "rest" }[];
  completed: number;
  total: number;
}

/**
 * Sober ambient header inspired by the "Signature" mock.
 * - small program/week caption
 * - large French greeting
 * - subtle dots row (done = fg, today = primary, planned = muted)
 */
const SignatureHeader = ({
  userName,
  programName,
  weekIndex,
  totalWeeks,
  weekDays,
  completed,
  total,
}: SignatureHeaderProps) => {
  const { t } = useTranslation(["calendar", "common"]);
  const trainingDays = weekDays.filter((d) => d.state !== "rest");

  return (
    <header className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] truncate">
          {programName ? `${programName} · ${t("common:week")} ${weekIndex + 1}/${totalWeeks}` : t("calendar:your_program")}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <span className="tabular text-[10px] font-semibold text-muted-foreground">
            {completed}/{total}
          </span>
          <div className="flex gap-1">
            {trainingDays.map((d, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  d.state === "done" && "bg-foreground",
                  d.state === "today" && "bg-primary pulse-accent",
                  d.state === "planned" && "bg-border-strong",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        {t("calendar:hello", { name: userName })}
      </h1>
    </header>
  );
};

export default SignatureHeader;