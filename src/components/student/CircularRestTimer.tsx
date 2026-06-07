import { useState, useEffect, useRef } from "react";
import { Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { unlockAudio } from "@/lib/audioUnlock";

interface CircularRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  storageKey?: string;
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

const CircularRestTimer = ({ initialSeconds, onComplete, autoStart = true, storageKey }: CircularRestTimerProps) => {
  const { t } = useTranslation(["common", "session"]);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [seconds, setSeconds] = useState<number>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const remaining = Math.ceil((parseInt(saved, 10) - Date.now()) / 1000);
        if (remaining > 0 && remaining <= initialSeconds) return remaining;
      }
    }
    return initialSeconds;
  });
  const [running, setRunning] = useState(autoStart);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const warmAudio = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new AudioContext(); } catch {}
    }
    audioCtxRef.current?.resume().catch(() => {});
  };

  useEffect(() => {
    if (!running || seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    if (!endTimeRef.current) {
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const ts = parseInt(saved, 10);
          if (ts > Date.now()) { endTimeRef.current = ts; }
        }
      }
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + seconds * 1000;
        if (storageKey) localStorage.setItem(storageKey, String(endTimeRef.current));
      }
    }
    intervalRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setSeconds(0);
        setRunning(false);
        setFinished(true);
        endTimeRef.current = null;
        if (storageKey) localStorage.removeItem(storageKey);
        try {
          const ctx = audioCtxRef.current ?? new AudioContext();
          audioCtxRef.current = ctx;
          ctx.resume().then(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          });
        } catch {}
        try { navigator.vibrate?.([200, 100, 200, 100, 200]); } catch {}
        sendTimerNotification(t("common:rest_label") + " — " + t("session:session_done", "Done!"));
        onCompleteRef.current?.();
      } else {
        setSeconds(remaining);
      }
    }, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = () => {
    endTimeRef.current = null;
    if (storageKey) localStorage.removeItem(storageKey);
    unlockAudio();
    warmAudio();
    setSeconds(totalSeconds);
    setRunning(true);
    setFinished(false);
  };
  const toggle = () => {
    unlockAudio();
    warmAudio();
    if (running) {
      endTimeRef.current = null;
      if (storageKey) localStorage.removeItem(storageKey);
    }
    setRunning(r => !r);
  };
  const adjust = (delta: number) => {
    unlockAudio();
    warmAudio();
    endTimeRef.current = null;
    if (storageKey) localStorage.removeItem(storageKey);
    const newTotal = Math.max(15, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds(s => Math.max(0, s + delta));
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
