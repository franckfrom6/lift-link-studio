import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { unlockAudio } from "@/lib/audioUnlock";

interface LinearRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  storageKey?: string;
}

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

const LinearRestTimer = ({ initialSeconds, onComplete, autoStart = true, storageKey }: LinearRestTimerProps) => {
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
    const newTotal = Math.max(10, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds(s => Math.max(0, s + delta));
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
