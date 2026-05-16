import { useState, useEffect, useRef } from "react";
import { Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const RADIUS = 56;
const STROKE = 4;
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
  const endTimeRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!running || seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (running) {
      endTimeRef.current = Date.now() + seconds * 1000;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(() => {
        if (!endTimeRef.current) return 0;
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        if (remaining <= 0) {
          setRunning(false);
          setFinished(true);
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; gain.gain.value = 0.3;
            osc.start(); osc.stop(ctx.currentTime + 0.3);
          } catch {}
          try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
          sendTimerNotification(t("common:rest_label") + " — Done!");
          onCompleteRef.current?.();
          return 0;
        }
        return remaining;
      });
    }, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && endTimeRef.current && running) {
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setSeconds(remaining);
        if (remaining <= 0) {
          setRunning(false);
          setFinished(true);
          onCompleteRef.current?.();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [running]);

  const reset = () => {
    setSeconds(totalSeconds);
    endTimeRef.current = Date.now() + totalSeconds * 1000;
    setRunning(true);
    setFinished(false);
  };
  const toggle = () => {
    if (!running) {
      endTimeRef.current = Date.now() + seconds * 1000;
    } else {
      endTimeRef.current = null;
    }
    setRunning(!running);
  };
  const adjust = (delta: number) => {
    const newTotal = Math.max(15, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds((s) => {
      const next = Math.max(0, s + delta);
      if (running) endTimeRef.current = Date.now() + next * 1000;
      return next;
    });
  };

  const progress = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 1;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const timerLabel = finished
    ? t("common:rest_label") + " ✓"
    : `${t("common:rest_label")} ${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "rounded-md border p-4 text-center space-y-3",
        finished ? "bg-bg-tinted border-foreground/20" : "bg-bg-tinted border-border"
      )}
      role="timer"
      aria-label={timerLabel}
    >
      <div className="text-[10px] font-semibold text-muted-subtle uppercase tracking-[0.12em]">
        {finished ? t("common:rest_label") + " ✓" : t("common:rest_label")}
      </div>

      {/* Sober ring — thin stroke, no gradient */}
      <div className="relative w-32 h-32 mx-auto">
        <AnimatePresence>
          {finished && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 16px 2px hsl(var(--foreground) / 0.15)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
          <circle
            cx="64" cy="64" r={RADIUS}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx="64" cy="64" r={RADIUS}
            fill="none"
            stroke={finished ? "hsl(var(--foreground))" : "hsl(var(--primary))"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={cn(
              "text-[34px] font-bold tabular-nums leading-none tracking-tight",
              finished ? "text-foreground" : "text-primary"
            )}
            key={seconds}
            initial={seconds <= 5 && seconds > 0 ? { scale: 1.1 } : {}}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            {mins}:{secs.toString().padStart(2, "0")}
          </motion.span>
        </div>
      </div>

      {/* Adjust buttons — sober outline */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjust(-15)}
          className="h-11 min-w-[44px] px-2.5 text-xs rounded-sm"
          aria-label="-15s"
        >
          <Minus className="w-4 h-4 mr-1" strokeWidth={1.5} />15s
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          className="h-11 w-11 rounded-sm"
          aria-label={running ? "Pause" : "Play"}
        >
          {running ? <Pause className="w-4 h-4" strokeWidth={1.5} /> : <Play className="w-4 h-4" strokeWidth={1.5} />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className="h-11 w-11 rounded-sm"
          aria-label="Reset"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjust(15)}
          className="h-11 min-w-[44px] px-2.5 text-xs rounded-sm"
          aria-label="+15s"
        >
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />15s
        </Button>
      </div>
    </motion.div>
  );
};

export default CircularRestTimer;
