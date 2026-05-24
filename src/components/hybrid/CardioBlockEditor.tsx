import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  CardioSpec,
  CardioModality,
  CardioMode,
  IntentTag,
  MODALITY_ICONS,
  MODALITY_LABELS,
  INTENT_LABELS,
} from "@/types/hybrid";

interface CardioBlockEditorProps {
  value: CardioSpec;
  onChange: (spec: CardioSpec) => void;
}

const MODALITIES: CardioModality[] = [
  "run", "trail", "row", "ski_erg", "bike", "assault", "walk", "other",
];

const MODE_LABELS: Record<CardioMode, string> = {
  distance: "Distance",
  time: "Temps",
  intervals: "Intervalles",
};

const INTENTS: IntentTag[] = ["ef", "seuil", "vma", "recup"];
const INTENT_SHORT: Record<IntentTag, string> = {
  ef: "EF", seuil: "Seuil", vma: "VMA", recup: "Récup",
};

// ─── Pace helpers (mm:ss /km <-> seconds) ──────────────────────────
function paceToString(sec: number | undefined): string {
  if (!sec || sec <= 0) return "";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function parsePace(str: string): number | undefined {
  const m = str.trim().match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return undefined;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  if (isNaN(min) || isNaN(sec) || sec >= 60) return undefined;
  return min * 60 + sec;
}

export function CardioBlockEditor({ value, onChange }: CardioBlockEditorProps) {
  const [showPaceRange, setShowPaceRange] = useState(
    !!(value.pace_min_s || value.pace_max_s)
  );
  const [showNotes, setShowNotes] = useState(!!value.notes);
  const [zoneOrRpe, setZoneOrRpe] = useState<"zone" | "rpe">(
    value.target_rpe ? "rpe" : "zone"
  );

  // Local pace string state for free typing
  const [paceStr, setPaceStr] = useState(paceToString(value.target_pace_s));
  const [paceMinStr, setPaceMinStr] = useState(paceToString(value.pace_min_s));
  const [paceMaxStr, setPaceMaxStr] = useState(paceToString(value.pace_max_s));

  const update = (patch: Partial<CardioSpec>) => onChange({ ...value, ...patch });

  const setMode = (mode: CardioMode) => {
    if (mode === "intervals" && !value.interval) {
      update({
        mode,
        interval: {
          recovery_type: "active",
          recovery_duration_s: 60,
        },
        repeats: value.repeats || 5,
      });
    } else {
      update({ mode });
    }
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1 — Modalité */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Modalité
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {MODALITIES.map((m) => {
            const active = value.modality === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => update({ modality: m })}
                className={cn(
                  "flex flex-col items-center gap-0.5 min-w-[60px] min-h-[44px] rounded-lg border p-2.5 transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <span className="text-xl leading-none">{MODALITY_ICONS[m]}</span>
                <span className="text-[9px] font-medium truncate max-w-[52px] text-center">
                  {MODALITY_LABELS[m].replace(/^[^\s]+\s/, "")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 — Mode */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Mode de prescription
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(MODE_LABELS) as CardioMode[]).map((mode) => {
            const active = value.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={cn(
                  "h-10 rounded-lg border text-sm font-medium transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                )}
              >
                {MODE_LABELS[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3 — Fields per mode */}
      {value.mode === "distance" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Distance (m)
              </label>
              <Input
                type="number"
                inputMode="numeric"
                className="h-10 text-sm tabular-nums"
                value={value.target_distance_m ?? ""}
                onChange={(e) =>
                  update({
                    target_distance_m: e.target.value
                      ? Math.max(0, parseInt(e.target.value, 10))
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Allure cible (mm:ss /km)
              </label>
              <Input
                placeholder="5:30"
                className="h-10 text-sm tabular-nums"
                value={paceStr}
                onChange={(e) => setPaceStr(e.target.value)}
                onBlur={() => update({ target_pace_s: parsePace(paceStr) })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPaceRange((s) => !s)}
            className="text-xs text-primary font-medium"
          >
            {showPaceRange ? "− Masquer fourchette" : "＋ Fourchette d'allure"}
          </button>

          {showPaceRange && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Allure min
                </label>
                <Input
                  placeholder="6:00"
                  className="h-10 text-sm tabular-nums"
                  value={paceMinStr}
                  onChange={(e) => setPaceMinStr(e.target.value)}
                  onBlur={() => update({ pace_min_s: parsePace(paceMinStr) })}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Allure max
                </label>
                <Input
                  placeholder="5:00"
                  className="h-10 text-sm tabular-nums"
                  value={paceMaxStr}
                  onChange={(e) => setPaceMaxStr(e.target.value)}
                  onBlur={() => update({ pace_max_s: parsePace(paceMaxStr) })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {value.mode === "time" && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">
              Durée (min)
            </label>
            <Input
              type="number"
              inputMode="numeric"
              className="h-10 text-sm tabular-nums"
              value={
                value.target_duration_s
                  ? Math.round(value.target_duration_s / 60)
                  : ""
              }
              onChange={(e) =>
                update({
                  target_duration_s: e.target.value
                    ? Math.max(0, parseInt(e.target.value, 10)) * 60
                    : undefined,
                })
              }
            />
          </div>

          <div>
            <div className="flex gap-1.5 mb-2">
              {(["zone", "rpe"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setZoneOrRpe(opt);
                    if (opt === "zone") update({ target_rpe: undefined });
                    else update({ target_zone: undefined });
                  }}
                  className={cn(
                    "h-7 px-3 rounded-full text-xs font-medium border transition",
                    zoneOrRpe === opt
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {opt === "zone" ? "Zone" : "RPE"}
                </button>
              ))}
            </div>

            {zoneOrRpe === "zone" ? (
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((z) => {
                  const active = value.target_zone === z;
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => update({ target_zone: z })}
                      className={cn(
                        "h-10 rounded-lg border text-sm font-semibold tabular-nums transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground"
                      )}
                    >
                      Z{z}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">RPE</span>
                  <span className="font-semibold tabular-nums">
                    {value.target_rpe ?? 5}/10
                  </span>
                </div>
                <Slider
                  value={[value.target_rpe ?? 5]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => update({ target_rpe: v[0] })}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {value.mode === "intervals" && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">
              Répétitions
            </label>
            <Input
              type="number"
              inputMode="numeric"
              className="h-10 text-sm tabular-nums"
              value={value.repeats ?? ""}
              onChange={(e) =>
                update({
                  repeats: e.target.value
                    ? Math.max(1, parseInt(e.target.value, 10))
                    : undefined,
                })
              }
            />
          </div>

          <IntervalWorkPicker value={value} update={update} />

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
              Zone
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {([1, 2, 3, 4, 5] as const).map((z) => {
                const active = value.interval?.zone === z;
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() =>
                      update({
                        interval: {
                          ...(value.interval ?? {
                            recovery_type: "active",
                            recovery_duration_s: 60,
                          }),
                          zone: z,
                        },
                      })
                    }
                    className={cn(
                      "h-10 rounded-lg border text-sm font-semibold tabular-nums transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    Z{z}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
              Récupération
            </label>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              {(["active", "passive"] as const).map((rt) => {
                const active = value.interval?.recovery_type === rt;
                return (
                  <button
                    key={rt}
                    type="button"
                    onClick={() =>
                      update({
                        interval: {
                          ...(value.interval ?? { recovery_duration_s: 60 }),
                          recovery_type: rt,
                        } as any,
                      })
                    }
                    className={cn(
                      "h-10 rounded-lg border text-sm font-medium transition",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    {rt === "active" ? "Active" : "Passive"}
                  </button>
                );
              })}
              <Input
                type="number"
                inputMode="numeric"
                placeholder="min"
                className="h-10 w-20 text-sm tabular-nums"
                value={
                  value.interval?.recovery_duration_s
                    ? Math.round(value.interval.recovery_duration_s / 60)
                    : ""
                }
                onChange={(e) =>
                  update({
                    interval: {
                      ...(value.interval ?? { recovery_type: "active" }),
                      recovery_duration_s: e.target.value
                        ? Math.max(0, parseInt(e.target.value, 10)) * 60
                        : 0,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5 — Intent tag */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Intention
        </p>
        <div className="flex flex-wrap gap-1.5">
          {INTENTS.map((t) => {
            const active = value.intent_tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() =>
                  update({ intent_tag: active ? undefined : t })
                }
                title={INTENT_LABELS[t]}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium border transition",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                {INTENT_SHORT[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4 — Notes */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes((s) => !s)}
          className="text-xs text-primary font-medium"
        >
          {showNotes ? "− Masquer notes" : "＋ Notes"}
        </button>
        {showNotes && (
          <Textarea
            rows={2}
            placeholder="Intention, consigne technique…"
            className="mt-2 text-sm"
            value={value.notes ?? ""}
            onChange={(e) => update({ notes: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

function IntervalWorkPicker({
  value,
  update,
}: {
  value: CardioSpec;
  update: (patch: Partial<CardioSpec>) => void;
}) {
  const interval = value.interval ?? {
    recovery_type: "active" as const,
    recovery_duration_s: 60,
  };
  const mode: "distance" | "duration" = interval.work_distance_m
    ? "distance"
    : interval.work_duration_s
    ? "duration"
    : "distance";

  const setMode = (m: "distance" | "duration") => {
    if (m === "distance") {
      update({
        interval: {
          ...interval,
          work_duration_s: undefined,
          work_distance_m: interval.work_distance_m ?? 400,
        },
      });
    } else {
      update({
        interval: {
          ...interval,
          work_distance_m: undefined,
          work_duration_s: interval.work_duration_s ?? 120,
        },
      });
    }
  };

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        {(["distance", "duration"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "h-7 px-3 rounded-full text-xs font-medium border transition",
              mode === m
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {m === "distance" ? "par distance" : "par durée"}
          </button>
        ))}
      </div>
      {mode === "distance" ? (
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Distance (m)"
          className="h-10 text-sm tabular-nums"
          value={interval.work_distance_m ?? ""}
          onChange={(e) =>
            update({
              interval: {
                ...interval,
                work_distance_m: e.target.value
                  ? Math.max(0, parseInt(e.target.value, 10))
                  : undefined,
              },
            })
          }
        />
      ) : (
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Durée (min)"
          className="h-10 text-sm tabular-nums"
          value={
            interval.work_duration_s
              ? Math.round(interval.work_duration_s / 60)
              : ""
          }
          onChange={(e) =>
            update({
              interval: {
                ...interval,
                work_duration_s: e.target.value
                  ? Math.max(0, parseInt(e.target.value, 10)) * 60
                  : undefined,
              },
            })
          }
        />
      )}
    </div>
  );
}