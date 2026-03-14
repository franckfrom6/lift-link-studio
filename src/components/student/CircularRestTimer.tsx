import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface CircularRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendTimerNotification(title: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { icon: "/favicon.svg", tag: "rest-timer", requireInteraction: false });
    } catch {}
  }
}

const CircularRestTimer = ({ initialSeconds, onComplete, autoStart = true }: CircularRestTimerProps) => {
  const { t } = useTranslation(["common", "session"]);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
          // Audio beep
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
          // Vibrate
          try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
          // Web Notification (for background/screen-off)
          sendTimerNotification(t("common:rest_label") + " — " + t("session:session_done", "Done!"));
          onCompleteRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds, t]);

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

  const restDoneLabel = t("common:rest_label") + " — " + (finished ? "✓" : "");
  const timerLabel = finished ? restDoneLabel : `${t("common:rest_label")} ${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      className={`rounded-xl p-4 text-center space-y-3 transition-colors border ${
        finished ? "bg-success-bg border-success/20" : "bg-info-bg border-info/20"
      }`}
      role="timer"
      aria-label={timerLabel}
    >
      <div className="flex items-center justify-center gap-2">
        <Timer className="w-4 h-4 text-info" strokeWidth={1.5} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.05em]">
          {finished ? t("common:rest_label") + " ✓" : t("common:rest_label")}
        </span>
      </div>

      {/* Circular progress */}
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="6"
          />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="hsl(var(--info))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold tabular-nums ${finished ? "text-success" : "text-foreground"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Adjust buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => adjust(-15)} className="h-11 min-w-[44px] px-2.5 text-xs" aria-label={t("common:rest_label") + " -15s"}>
          <Minus className="w-4 h-4 mr-1" strokeWidth={1.5} />15s
        </Button>
        <Button variant="outline" size="icon" onClick={toggle} className="h-11 w-11" aria-label={running ? "Pause" : "Play"}>
          {running ? <Pause className="w-4 h-4" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
        </Button>
        <Button variant="outline" size="icon" onClick={reset} className="h-11 w-11" aria-label="Reset">
          <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => adjust(15)} className="h-11 min-w-[44px] px-2.5 text-xs" aria-label={t("common:rest_label") + " +15s"}>
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />15s
        </Button>
      </div>
    </div>
  );
};

export default CircularRestTimer;
