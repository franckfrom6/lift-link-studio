import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CircularRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CircularRestTimer = ({ initialSeconds, onComplete, autoStart = true }: CircularRestTimerProps) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!running || seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          setFinished(true);
          // Beep sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch {}
          // Vibration
          try { navigator.vibrate?.([200, 100, 200]); } catch {}
          onCompleteRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  const reset = () => {
    setSeconds(totalSeconds);
    setRunning(true);
    setFinished(false);
  };

  const toggle = () => setRunning(!running);

  const adjust = (delta: number) => {
    const newTotal = Math.max(15, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds((s) => Math.max(0, s + delta));
  };

  const progress = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 1;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);
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

      {/* Circular progress */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="6"
          />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-display font-bold tabular-nums ${finished ? "text-primary" : "text-foreground"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Adjust buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => adjust(-15)} className="h-8 px-2 text-xs">
          <Minus className="w-3 h-3 mr-1" />15s
        </Button>
        <Button variant="outline" size="sm" onClick={toggle} className="h-8">
          {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="outline" size="sm" onClick={reset} className="h-8">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => adjust(15)} className="h-8 px-2 text-xs">
          <Plus className="w-3 h-3 mr-1" />15s
        </Button>
      </div>
    </div>
  );
};

export default CircularRestTimer;
