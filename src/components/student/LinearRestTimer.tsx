import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LinearRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

function sendTimerNotification(title: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { icon: "/favicon.svg", tag: "rest-timer", requireInteraction: false });
    } catch {}
  }
}

const LinearRestTimer = ({ initialSeconds, onComplete, autoStart = true }: LinearRestTimerProps) => {
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
    const newTotal = Math.max(10, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds((s) => {
      const next = Math.max(0, s + delta);
      if (running) endTimeRef.current = Date.now() + next * 1000;
      return next;
    });
  };

  const progress = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 1;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "rounded-2xl border-2 p-4 space-y-3 transition-colors",
        finished
          ? "bg-card border-foreground/20"
          : "bg-card border-primary/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          REPOS
        </span>
        {finished ? (
          <span className="text-success font-bold text-base">C'est parti ! 💪</span>
        ) : (
          <span className="text-4xl font-black tabular-nums tracking-tight text-primary">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Linear progress bar */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", finished ? "bg-success" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => adjust(-15)}
          className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card"
        >
          <Minus className="w-3.5 h-3.5 mr-0.5" />15s
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-10 w-10 text-foreground hover:bg-card"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="h-10 w-10 text-foreground hover:bg-card"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => adjust(15)}
          className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-card"
        >
          <Plus className="w-3.5 h-3.5 mr-0.5" />15s
        </Button>
      </div>
    </motion.div>
  );
};

export default LinearRestTimer;
