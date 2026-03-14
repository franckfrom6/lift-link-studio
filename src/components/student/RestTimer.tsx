import { useState, useEffect, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const RestTimer = ({ initialSeconds, onComplete, autoStart = true }: RestTimerProps) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setFinished(true);
          // Vibrate on rest complete
          try { navigator.vibrate?.([200, 100, 200]); } catch {}
          onComplete?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, seconds, onComplete]);

  const reset = () => {
    setSeconds(initialSeconds);
    setRunning(true);
    setFinished(false);
  };

  const toggle = () => setRunning(!running);

  const pct = ((initialSeconds - seconds) / initialSeconds) * 100;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className={`rounded-xl p-4 text-center space-y-3 transition-colors ${
      finished ? "bg-primary/20 border border-primary/30" : "bg-surface border border-border"
    }`}>
      <div className="flex items-center justify-center gap-2">
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {finished ? "Repos terminé !" : "Repos"}
        </span>
      </div>

      <div className={`text-4xl font-display font-bold tabular-nums ${finished ? "text-primary" : "text-foreground"}`}>
        {mins}:{secs.toString().padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={seconds} aria-valuemin={0} aria-valuemax={initialSeconds} aria-label="Rest timer">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={toggle}>
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default RestTimer;
