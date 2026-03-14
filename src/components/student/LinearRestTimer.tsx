import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface LinearRestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

const LinearRestTimer = ({ initialSeconds, onComplete, autoStart = true }: LinearRestTimerProps) => {
  const { t } = useTranslation(["common", "session"]);
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
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; gain.gain.value = 0.3;
            osc.start(); osc.stop(ctx.currentTime + 0.3);
          } catch {}
          try { navigator.vibrate?.([200, 100, 200]); } catch {}
          onCompleteRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  const reset = () => { setSeconds(totalSeconds); setRunning(true); setFinished(false); };
  const toggle = () => setRunning(!running);
  const adjust = (delta: number) => {
    const newTotal = Math.max(10, totalSeconds + delta);
    setTotalSeconds(newTotal);
    setSeconds((s) => Math.max(0, s + delta));
  };

  const progress = totalSeconds > 0 ? (totalSeconds - seconds) / totalSeconds : 1;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl p-3 space-y-2.5 transition-colors ${
        finished ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800/50 border border-zinc-700/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {finished ? "✓ " + t("common:rest_label") : t("common:rest_label")}
        </span>
        <span className={`text-2xl font-bold tabular-nums ${finished ? "text-emerald-400" : "text-zinc-100"}`}>
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Linear progress bar */}
      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${finished ? "bg-emerald-400" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => adjust(-15)} className="h-9 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700">
          <Minus className="w-3.5 h-3.5 mr-0.5" />15s
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} className="h-10 w-10 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700">
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} className="h-10 w-10 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => adjust(15)} className="h-9 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700">
          <Plus className="w-3.5 h-3.5 mr-0.5" />15s
        </Button>
      </div>
    </motion.div>
  );
};

export default LinearRestTimer;
