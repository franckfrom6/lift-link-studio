import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X, Check, Plus, ArrowLeftRight, Timer, Route, Dumbbell, SkipForward, Star, Play } from "lucide-react";
import NumericInput from "./NumericInput";
import DurationInput from "./DurationInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExerciseVideoEmbed } from "./ExerciseVideoEmbed";
import RPESelector from "./RPESelector";
import CoachInstructionsButton from "./CoachInstructionsButton";
import { useTranslation } from "react-i18next";
import { useIsAdvanced } from "@/contexts/DisplayModeContext";
import ExercisePhoto from "./ExercisePhoto";
import { AnimatePresence, motion } from "framer-motion";
import { StatBadge, VideoThumb } from "./SageAtoms";
import { Link } from "react-router-dom";

export type TrackingType = "weight_reps" | "reps_only" | "duration" | "distance";

export interface EnhancedCompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  isFailure: boolean;
  rpeActual: number | null;
  durationSeconds?: number;
}

interface EnhancedExerciseCardProps {
  name: string;
  exerciseId?: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  tempo?: string | null;
  rpeTarget?: string | null;
  suggestedWeight?: number | null;
  coachNotes?: string | null;
  videoUrl?: string | null;
  videoSearchQuery?: string | null;
  videoUrlFemale?: string | null;
  videoUrlMale?: string | null;
  exerciseVideoUrl?: string | null;
  isActive: boolean;
  completedSets: EnhancedCompletedSet[];
  onCompletedSetsChange: (sets: EnhancedCompletedSet[]) => void;
  onAllSetsComplete: () => void;
  onSwapExercise?: () => void;
  onSkipExercise?: () => void;
  hasAlternatives?: boolean;
  isSubstituted?: boolean;
  isSkipped?: boolean;
  previousSets?: { weight: number; reps: number }[];
  trackingType?: TrackingType;
  sessionExerciseId?: string;
  completedSessionId?: string;
  onActivate?: () => void;
  onSetValidated?: (restSeconds: number) => void;
  onRestStart?: (seconds: number) => void;
}

const EnhancedExerciseCard = ({
  name, exerciseId, sets: targetSets, repsMin, repsMax, restSeconds,
  tempo, rpeTarget, suggestedWeight, coachNotes,
  videoUrl, videoSearchQuery,
  videoUrlFemale, videoUrlMale, exerciseVideoUrl,
  isActive, completedSets, onCompletedSetsChange, onAllSetsComplete,
  onSwapExercise, onSkipExercise, hasAlternatives, isSubstituted, isSkipped,
  previousSets,
  trackingType = "weight_reps",
  sessionExerciseId,
  completedSessionId,
  onActivate,
  onSetValidated,
  onRestStart,
}: EnhancedExerciseCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation('exercises');
  const isAdvanced = useIsAdvanced();
  const [currentSetIdx, setCurrentSetIdx] = useState(
    completedSets.findIndex(s => s.reps === 0 && (s.durationSeconds || 0) === 0) >= 0
      ? completedSets.findIndex(s => s.reps === 0 && (s.durationSeconds || 0) === 0)
      : completedSets.length < targetSets ? completedSets.length : -1
  );
  const [allDone, setAllDone] = useState(
    completedSets.length >= targetSets && completedSets.every(s => 
      trackingType === "duration" ? (s.durationSeconds || 0) > 0 : s.reps > 0
    )
  );
  const [exercisePhotos, setExercisePhotos] = useState<string[]>([]);
  const [justCompletedSet, setJustCompletedSet] = useState<number | null>(null);
  const [prDetected, setPrDetected] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [readyForNext, setReadyForNext] = useState(false);

  useEffect(() => {
    if (isActive) setExpanded(true);
  }, [isActive]);

  const initialCompletedSets = useMemo<EnhancedCompletedSet[]>(() => (
    Array.from({ length: targetSets }, (_, i) => ({
      setNumber: i + 1,
      weight: trackingType === "weight_reps" ? (suggestedWeight || 0) : 0,
      reps: 0,
      isFailure: false,
      rpeActual: null,
      durationSeconds: 0,
    }))
  ), [suggestedWeight, targetSets, trackingType]);

  const visibleCompletedSets = completedSets.length > 0 ? completedSets : initialCompletedSets;

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!isActive || initializedRef.current || completedSets.length > 0 || initialCompletedSets.length === 0) return;
    initializedRef.current = true;
    onCompletedSetsChange(initialCompletedSets);
  }, [isActive, completedSets.length, initialCompletedSets, onCompletedSetsChange]);

  const updateSet = (idx: number, field: keyof EnhancedCompletedSet, value: any) => {
    const updated = [...visibleCompletedSets];
    updated[idx] = { ...updated[idx], [field]: value };
    onCompletedSetsChange(updated);
  };

  const isSetComplete = (set: EnhancedCompletedSet) => {
    if (trackingType === "duration") return (set.durationSeconds || 0) > 0;
    return set.reps > 0;
  };

  const validateSet = (idx: number) => {
    // Trigger completion animation
    setJustCompletedSet(idx);
    setTimeout(() => setJustCompletedSet(null), 600);

    // PR detection in Advanced mode
    if (isAdvanced && previousSets && previousSets[idx] && trackingType === "weight_reps") {
      const current = visibleCompletedSets[idx];
      if (current.weight > previousSets[idx].weight) {
        setPrDetected(idx);
        setTimeout(() => setPrDetected(null), 1500);
        try { navigator.vibrate?.([100, 50, 100]); } catch {}
      }
    }

    if (idx < visibleCompletedSets.length - 1) {
      setCurrentSetIdx(idx + 1);
      const updated = [...visibleCompletedSets];
      if (trackingType === "weight_reps" && updated[idx + 1] && updated[idx + 1].weight === 0) {
        updated[idx + 1] = { ...updated[idx + 1], weight: updated[idx].weight };
        onCompletedSetsChange(updated);
      }
      if (restSeconds > 0) {
        onSetValidated?.(restSeconds);
        onRestStart?.(restSeconds);
      }
    } else {
      setAllDone(true);
      setCurrentSetIdx(-1);
      if (restSeconds > 0) {
        onSetValidated?.(restSeconds);
        onRestStart?.(restSeconds);
      }
      setReadyForNext(true);
    }
  };

  const addSet = () => {
    const lastWeight = visibleCompletedSets[visibleCompletedSets.length - 1]?.weight || 0;
    onCompletedSetsChange([
      ...visibleCompletedSets,
      { setNumber: visibleCompletedSets.length + 1, weight: lastWeight, reps: 0, isFailure: false, rpeActual: null, durationSeconds: 0 }
    ]);
    if (allDone) {
      setAllDone(false);
      setCurrentSetIdx(visibleCompletedSets.length);
      setReadyForNext(false);
    }
  };

  const getPrevComparison = (idx: number, field: "weight" | "reps") => {
    if (!isAdvanced) return null;
    if (!previousSets || !previousSets[idx]) return null;
    const current = visibleCompletedSets[idx]?.[field] || 0;
    const prev = previousSets[idx][field];
    if (current === 0 || prev === 0) return null;
    if (current > prev) return "up";
    if (current < prev) return "down";
    return "same";
  };

  // Tags display based on tracking type
  const renderTags = () => {
    switch (trackingType) {
      case "duration":
        return (
          <>
            <StatBadge>{targetSets} séries</StatBadge>
            <StatBadge>
              <Timer className="w-2.5 h-2.5" />
              {repsMin >= 60 ? `${Math.floor(repsMin / 60)}min` : `${repsMin}s`}
            </StatBadge>
          </>
        );
      case "reps_only":
        return (
          <StatBadge>
            {targetSets}×{repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`}
          </StatBadge>
        );
      case "distance":
        return (
          <>
            <StatBadge>
              <Route className="w-2.5 h-2.5" />
              {repsMin}m
            </StatBadge>
            <StatBadge>{targetSets} séries</StatBadge>
          </>
        );
      default:
        return (
          <>
            <StatBadge>{targetSets} séries</StatBadge>
            <StatBadge>
              {repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`} reps
            </StatBadge>
          </>
        );
    }
  };

  const renderSetHeader = () => {
    switch (trackingType) {
      case "duration":
        return (
          <div className="grid grid-cols-[36px_1fr_40px_40px] gap-1.5 min-w-[240px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>{t('duration_sec', 'Durée')}</span>
            <span></span>
            <span></span>
          </div>
        );
      case "reps_only":
        return (
          <div className="grid grid-cols-[36px_1fr_40px_40px] gap-1.5 min-w-[240px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>Reps</span>
            <span className="text-center">Fail</span>
            <span></span>
          </div>
        );
      case "distance":
        return (
          <div className="grid grid-cols-[36px_1fr_1fr_40px] gap-1.5 min-w-[260px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
            <span>Set</span>
            <span>{t('distance_m', 'Dist. (m)')}</span>
            <span>{t('duration_sec', 'Durée (s)')}</span>
            <span></span>
          </div>
        );
      default:
        return (
          <>
            <div className="hidden xs:grid grid-cols-[36px_1fr_1fr_40px_40px] gap-1.5 min-w-[280px] text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
              <span>Set</span>
              <span>Kg</span>
              <span>Reps</span>
              <span className="text-center">Fail</span>
              <span></span>
            </div>
            <div className="xs:hidden text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-semibold px-1">
              <span>Set / Kg / Reps</span>
            </div>
          </>
        );
    }
  };

  // Comparison arrow component for Advanced mode
  const ComparisonArrow = ({ direction }: { direction: "up" | "down" | "same" | null }) => {
    if (!direction || direction === "same") return null;
    return (
      <motion.span
        initial={isAdvanced ? { opacity: 0, y: direction === "up" ? 6 : -6 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        className={cn(
          "absolute -right-0.5 -top-0.5 text-[9px] font-bold",
          direction === "up" && "text-success",
          direction === "down" && "text-destructive",
        )}
      >
        {direction === "up" ? "↑" : "↓"}
      </motion.span>
    );
  };

  // PR star burst for Advanced mode
  const PRBurst = ({ visible }: { visible: boolean }) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <div className="relative">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" strokeWidth={1.5} />
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-400/20"
              initial={{ scale: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderSetRow = (set: EnhancedCompletedSet, i: number) => {
    const isCurrent = i === currentSetIdx && !allDone;
    const isDone = i < currentSetIdx || allDone;
    const isJustCompleted = justCompletedSet === i;
    const rowClass = cn(
      "gap-2 items-center p-1.5 rounded-sm transition-colors",
      isCurrent && "bg-bg-tinted border border-foreground/20",
      isDone && "opacity-50"
    );
    const inputClass = "h-12 text-center bg-background text-base font-bold tabular-nums rounded-sm";
    const stableKey = `set-${i}`;

    const checkButton = isCurrent ? (
      <motion.div
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button size="icon" className="h-12 w-12 rounded-xl bg-primary" onClick={() => validateSet(i)} disabled={!isSetComplete(set)}>
          <Check className="w-5 h-5" strokeWidth={2} />
        </Button>
      </motion.div>
    ) : (
      <div className="h-12 w-12 flex items-center justify-center">
        {isDone && (
          <motion.div
            initial={isJustCompleted ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={isJustCompleted ? { type: "spring", stiffness: 600, damping: 15, delay: 0.05 } : {}}
          >
            <Check className="w-5 h-5 text-success" strokeWidth={2} />
          </motion.div>
        )}
      </div>
    );

    switch (trackingType) {
      case "duration": {
        return (
          <div key={stableKey} className={cn("grid grid-cols-[36px_1fr_40px_40px]", rowClass)}>
            <span className="text-sm font-bold text-center">{set.setNumber}</span>
            <DurationInput
              value={set.durationSeconds || 0}
              onChange={(secs) => updateSet(i, "durationSeconds", secs)}
              placeholder="0:00"
              className={inputClass}
              disabled={!isCurrent}
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={() => updateSet(i, "durationSeconds", (set.durationSeconds || 0) + 5)}
                disabled={!isCurrent}
                className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 touch-manipulation"
                aria-label="+5 seconds"
              >+5</button>
              <button
                onClick={() => updateSet(i, "durationSeconds", Math.max(0, (set.durationSeconds || 0) - 5))}
                disabled={!isCurrent}
                className="min-h-[40px] min-w-[40px] px-2 rounded-lg bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 touch-manipulation"
                aria-label="-5 seconds"
              >-5</button>
            </div>
            {checkButton}
          </div>
        );
      }
      case "reps_only":
        return (
          <div key={stableKey}>
            <div className={cn("grid grid-cols-[36px_1fr_40px_40px]", rowClass)}>
              <span className="text-sm font-bold text-center">{set.setNumber}</span>
              <NumericInput
                value={set.reps}
                onChange={(v) => updateSet(i, "reps", v)}
                placeholder="0"
                className={inputClass}
                disabled={!isCurrent}
                min={0}
              />
              <button
                onClick={() => updateSet(i, "isFailure", !set.isFailure)}
                disabled={!isCurrent}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center mx-auto transition-colors",
                  set.isFailure ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground",
                  "disabled:opacity-40"
                )}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              {checkButton}
            </div>
            {isAdvanced && isDone && (
              <div className="pl-9 mt-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">RPE:</span>
                  <RPESelector value={set.rpeActual} onChange={(rpe) => updateSet(i, "rpeActual", rpe)} disabled={false} />
                </div>
              </div>
            )}
          </div>
        );
      case "distance":
        return (
          <div key={stableKey} className={cn("grid grid-cols-[36px_1fr_1fr_40px]", rowClass)}>
            <span className="text-sm font-bold text-center">{set.setNumber}</span>
            <NumericInput
              value={set.reps}
              onChange={(v) => updateSet(i, "reps", v)}
              placeholder="0"
              className={inputClass}
              disabled={!isCurrent}
              min={0}
            />
            <NumericInput
              value={set.durationSeconds || 0}
              onChange={(v) => updateSet(i, "durationSeconds", v)}
              placeholder="0"
              className={inputClass}
              disabled={!isCurrent}
              min={0}
            />
            {checkButton}
          </div>
        );
      default: // weight_reps
        return (
          <div key={stableKey} className="relative">
            <PRBurst visible={prDetected === i} />
            {/* Desktop: 5-col grid */}
            <div className={cn("hidden xs:grid grid-cols-[36px_1fr_1fr_40px_40px]", rowClass)}>
              <span className="text-sm font-bold text-center">{set.setNumber}</span>
              <div className="relative">
                <NumericInput
                  value={set.weight}
                  onChange={(v) => updateSet(i, "weight", v)}
                  placeholder="0"
                  className={inputClass}
                  disabled={!isCurrent}
                  min={0}
                  step={2.5}
                />
                {isDone && <ComparisonArrow direction={getPrevComparison(i, "weight")} />}
              </div>
              <NumericInput
                value={set.reps}
                onChange={(v) => updateSet(i, "reps", v)}
                placeholder="0"
                className={inputClass}
                disabled={!isCurrent}
                min={0}
              />
              <button
                onClick={() => updateSet(i, "isFailure", !set.isFailure)}
                disabled={!isCurrent}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center mx-auto transition-colors",
                  set.isFailure ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground",
                  "disabled:opacity-40"
                )}
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              {checkButton}
            </div>
            {/* Small screens: stacked layout */}
            <div className={cn("xs:hidden flex flex-col gap-1.5", rowClass)}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold w-8 text-center shrink-0">{set.setNumber}</span>
                <div className="relative flex-1">
                  <NumericInput
                    value={set.weight}
                    onChange={(v) => updateSet(i, "weight", v)}
                    placeholder="Kg"
                    className={inputClass}
                    disabled={!isCurrent}
                    min={0}
                    step={2.5}
                  />
                </div>
                <div className="flex-1">
                  <NumericInput
                    value={set.reps}
                    onChange={(v) => updateSet(i, "reps", v)}
                    placeholder="Reps"
                    className={inputClass}
                    disabled={!isCurrent}
                    min={0}
                  />
                </div>
                <button
                  onClick={() => updateSet(i, "isFailure", !set.isFailure)}
                  disabled={!isCurrent}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    set.isFailure ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground",
                    "disabled:opacity-40"
                  )}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                {checkButton}
              </div>
            </div>
            {isAdvanced && isDone && (
              <div className="pl-9 mt-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">RPE:</span>
                  <RPESelector value={set.rpeActual} onChange={(rpe) => updateSet(i, "rpeActual", rpe)} disabled={false} />
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Format rest time as readable string
  const formatRest = () => {
    if (restSeconds <= 0) return "";
    if (restSeconds >= 60) {
      const m = Math.floor(restSeconds / 60);
      const s = restSeconds % 60;
      return s > 0 ? `${m}'${s.toString().padStart(2, '0')}` : `${m}'`;
    }
    return `${restSeconds}s`;
  };

  // Simple mode: inline text summary instead of badges
  const renderSimpleSummary = () => {
    const parts: string[] = [];
    switch (trackingType) {
      case "duration":
        parts.push(`${targetSets}s`);
        parts.push(repsMin >= 60 ? `${Math.floor(repsMin / 60)}min` : `${repsMin}s`);
        break;
      case "reps_only":
        parts.push(`${targetSets} × ${repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`}`);
        break;
      case "distance":
        parts.push(`${repsMin}m`);
        parts.push(`${targetSets}s`);
        break;
      default:
        parts.push(`${targetSets}s`);
        parts.push(`${repsMin === repsMax ? repsMin : `${repsMin}-${repsMax}`} reps`);
        break;
    }
    const rest = formatRest();
    if (rest) parts.push(`${rest} rest`);
    return parts.join(" · ");
  };

  if (isSkipped) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/30 opacity-50 p-2.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
          {exerciseId ? (
            <Link to={`/student/exercise/${exerciseId}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-sm truncate line-through hover:text-primary block">{name}</Link>
          ) : (
            <p className="font-semibold text-sm truncate line-through">{name}</p>
          )}
          </div>
          <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
            {t('skip_badge', 'Passé')}
          </span>
        </div>
      </div>
    );
  }

  // ── SIMPLE MODE: compact collapsed header ──
  const renderSimpleHeader = () => (
    <div
      className={cn("flex items-center gap-2 cursor-pointer", isActive ? "p-3.5" : "p-2.5")}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex-1 min-w-0">
        {/* LINE 1: name + substituted badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          {exerciseId ? (
            <Link to={`/student/exercise/${exerciseId}`} onClick={(e) => e.stopPropagation()} className={cn("font-bold truncate hover:text-primary transition-colors", isActive ? "text-base" : "text-sm font-semibold")}>{name}</Link>
          ) : (
            <p className={cn("font-bold truncate", isActive ? "text-base" : "text-sm font-semibold")}>{name}</p>
          )}
          {isSubstituted && (
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
              Modifié ↔
            </span>
          )}
        </div>
        {/* LINE 2: inline params */}
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{renderSimpleSummary()}</p>
      </div>

      {/* Right side: action buttons (only if active) + status + chevron */}
      <div className="flex items-center gap-0.5 shrink-0">
        {isActive && !allDone && (
          <>
            {!isAdvanced && (tempo || rpeTarget) && (
              <CoachInstructionsButton tempo={tempo} rpe={rpeTarget} coachNotes={coachNotes} />
            )}
            {onSkipExercise && (
              <button
                onClick={(e) => { e.stopPropagation(); onSkipExercise?.(); }}
                className="h-11 w-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
            {onSwapExercise && (
              <button
                onClick={(e) => { e.stopPropagation(); onSwapExercise?.(); }}
                className="h-11 w-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
          </>
        )}
        {allDone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Check className="w-4 h-4 text-success" strokeWidth={2} />
          </motion.div>
        )}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="ml-0.5"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </motion.div>
      </div>
    </div>
  );

  // ── ADVANCED MODE: Sage header (mirrors SessionPreview ExerciseCard) ──
  const hasAnyVideo = !!(videoUrl || videoUrlMale || videoUrlFemale || exerciseVideoUrl || videoSearchQuery || name);
  const renderAdvancedHeader = () => (
    <div className={cn("p-3.5 flex flex-col gap-2.5", isActive && "p-4")}>
      <div className="flex items-start gap-2.5">
        <VideoThumb hasVideo={hasAnyVideo} size={48} onClick={() => setShowVideo(true)} />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-start gap-1.5 flex-wrap">
            {exerciseId ? (
              <Link
                to={`/student/exercise/${exerciseId}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "font-bold leading-snug tracking-tight break-words hover:text-primary transition-colors",
                  isActive ? "text-[15px]" : "text-sm"
                )}
              >
                {name}
              </Link>
            ) : (
              <p
                className={cn(
                  "font-bold leading-snug tracking-tight break-words",
                  isActive ? "text-[15px]" : "text-sm"
                )}
              >
                {name}
              </p>
            )}
            {isSubstituted && (
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                Modifié ↔
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          {onSkipExercise && !allDone && isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onSkipExercise?.(); }}
              className="h-11 w-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-bg-tinted transition-colors"
              title={t('skip_btn', 'Passer') as string}
            >
              <SkipForward className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
          {onSwapExercise && !allDone && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwapExercise?.(); }}
              className="h-11 w-11 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-bg-tinted transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
          {allDone && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Check className="w-4 h-4 text-foreground shrink-0" strokeWidth={2} />
            </motion.div>
          )}
          <motion.button
            onClick={() => setExpanded(!expanded)}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="h-11 w-11 flex items-center justify-center"
          >
            <ChevronDown className="w-4 h-4 text-muted-subtle shrink-0" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {renderTags()}
        {suggestedWeight && trackingType === "weight_reps" && (
          <StatBadge accent>{suggestedWeight} kg</StatBadge>
        )}
        {tempo && <StatBadge>tempo {tempo}</StatBadge>}
        {rpeTarget && <StatBadge>RPE {rpeTarget}</StatBadge>}
        {restSeconds > 0 && (
          <StatBadge>
            <Timer className="w-2.5 h-2.5" />
            {formatRest()}
          </StatBadge>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "rounded-md border bg-card transition-colors overflow-hidden",
        isActive
          ? "border-foreground/30 shadow-sm"
          : "border-border",
      )}
    >
      {/* Header: Simple vs Advanced */}
      {isAdvanced ? renderAdvancedHeader() : renderSimpleHeader()}

      {/* Expanded details: CSS grid animation avoids expensive layout projection on mobile */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ gridTemplateRows: "0fr", opacity: 0 }}
            animate={{ gridTemplateRows: "1fr", opacity: 1 }}
            exit={{ gridTemplateRows: "0fr", opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid overflow-hidden"
          >
            <div className="min-h-0 px-3 pb-3 space-y-4 border-t border-border pt-3">
              {/* Coach hints — small text block, kept above sets */}
              {(suggestedWeight || (isAdvanced && coachNotes)) && (
                <div className="space-y-2">
                  {suggestedWeight && trackingType === "weight_reps" && (
                    <p className="text-xs text-muted-foreground">
                      💪 <span className="font-medium">{t('target_weight')} :</span> {suggestedWeight} kg
                    </p>
                  )}
                  {isAdvanced && coachNotes && (
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      📝 {coachNotes}
                    </p>
                  )}
                </div>
              )}

              {isActive && visibleCompletedSets.length > 0 && (
                <div className="space-y-2">
                  {previousSets && previousSets.length > 0 && trackingType === "weight_reps" && (
                    <div className="flex items-center gap-2 py-1.5 px-2 bg-primary/5 border border-primary/15 rounded-lg">
                      <span className="text-[11px] text-muted-foreground">Dernière fois :</span>
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {previousSets[0].weight} kg × {previousSets[0].reps} reps
                      </span>
                      <button
                        type="button"
                        className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded"
                        onClick={() => {
                          const updated = visibleCompletedSets.map((s, i) => ({
                            ...s,
                            weight: previousSets[i]?.weight || previousSets[0].weight,
                          }));
                          onCompletedSetsChange(updated);
                        }}
                      >
                        Reprendre
                      </button>
                    </div>
                  )}
                  <div className="overflow-x-auto -mx-3 px-3">
                    {renderSetHeader()}
                    {visibleCompletedSets.map((set, i) => renderSetRow(set, i))}
                    {isActive && (
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={addSet}>
                        <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                        {t('add_set')}
                      </Button>
                    )}
                    {allDone && readyForNext && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pt-1"
                      >
                        <Button
                          className="w-full h-12 font-semibold"
                          onClick={() => { setReadyForNext(false); onAllSetsComplete(); }}
                        >
                          {t('next_exercise', { defaultValue: 'Exercice suivant →' })}
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {sessionExerciseId && completedSessionId && (
                    <ExercisePhoto
                      sessionExerciseId={sessionExerciseId}
                      completedSessionId={completedSessionId}
                      photos={exercisePhotos}
                      onPhotosChange={setExercisePhotos}
                    />
                  )}
                </div>
              )}

              {/* Inactive expanded preview: show summary + activate CTA instead of an empty void */}
              {!isActive && (
                <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {renderSimpleSummary()}
                  </p>
                  {onActivate && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => { e.stopPropagation(); onActivate(); }}
                    >
                      {t('activate_exercise', { defaultValue: 'Démarrer cet exercice' })}
                    </Button>
                  )}
                </div>
              )}

              {/* Demo video — ALWAYS opt-in, placed AFTER sets so it never
                  pushes the inputs/validate buttons off-screen. The iframe
                  only mounts after explicit click ("Voir la démo"). */}
              <div className="pt-1">
                {showVideo ? (
                  <ExerciseVideoEmbed
                    exerciseName={name}
                    directVideoUrl={videoUrl}
                    videoUrlFemale={videoUrlFemale}
                    videoUrlMale={videoUrlMale}
                    exerciseVideoUrl={exerciseVideoUrl}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3" strokeWidth={2} />
                    {t('show_demo', { defaultValue: '📹 Voir la démo' })}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedExerciseCard;
