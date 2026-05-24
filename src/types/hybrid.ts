// ─── Cardio ──────────────────────────────────────────────────────────────────
export type CardioModality =
  | 'run' | 'trail' | 'row' | 'ski_erg' | 'bike' | 'assault' | 'walk' | 'other';

export type CardioMode = 'distance' | 'time' | 'intervals';
export type RecoveryType = 'active' | 'passive';
export type IntentTag = 'ef' | 'seuil' | 'vma' | 'recup';

export interface CardioInterval {
  work_distance_m?: number;
  work_duration_s?: number;
  pace_s_per_km?: number;
  zone?: 1 | 2 | 3 | 4 | 5;
  recovery_type: RecoveryType;
  recovery_duration_s: number;
}

export interface CardioSpec {
  modality: CardioModality;
  mode: CardioMode;
  // Distance mode
  target_distance_m?: number;
  target_pace_s?: number;        // s/km (or s/500m for row)
  pace_min_s?: number;
  pace_max_s?: number;
  // Time mode
  target_duration_s?: number;
  target_zone?: 1 | 2 | 3 | 4 | 5;
  target_rpe?: number;
  // Intervals mode
  repeats?: number;
  interval?: CardioInterval;
  // Common
  notes?: string;
  intent_tag?: IntentTag;
}

// ─── Strength ─────────────────────────────────────────────────────────────────
export type StrengthFormat =
  | 'straight' | 'superset' | 'amrap' | 'emom' | 'for_time' | 'rounds';

export interface InlineExercise {
  id: string;
  name: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  tempo?: string;
  rest_s?: number;
  rpe_target?: number;
  suggested_weight?: number;
  notes?: string;
  group?: 'A1' | 'A2' | 'A3' | 'B1' | 'B2'; // for supersets
}

export interface StrengthSpec {
  format: StrengthFormat;
  exercises: InlineExercise[];
  duration_s?: number;       // AMRAP / EMOM
  rounds?: number;           // Rounds for Reps
  time_cap_s?: number;       // For Time / AMRAP / EMOM
  scaling_notes?: string;
  notes?: string;
}

// ─── Mixed block ─────────────────────────────────────────────────────────────
export interface SubBlock {
  id: string;
  type: 'cardio' | 'strength';
  label: string;
  cardio?: CardioSpec;
  exercise?: InlineExercise & { target_reps?: number; target_distance_m?: number };
}

// ─── Main block ───────────────────────────────────────────────────────────────
export type HybridBlockType = 'cardio' | 'strength' | 'mixed' | 'warmup' | 'cooldown';

export interface HybridBlock {
  id: string;
  type: HybridBlockType;
  name?: string;
  notes?: string;
  cardio?: CardioSpec;       // type === 'cardio' | 'warmup' | 'cooldown'
  strength?: StrengthSpec;   // type === 'strength'
  sub_blocks?: SubBlock[];   // type === 'mixed'
}

// ─── Execution log ────────────────────────────────────────────────────────────
export interface CardioBlockLog {
  actual_duration_s?: number;
  actual_distance_m?: number;
  actual_rpe?: number;
  note?: string;
}

export interface StrengthSetLog {
  set_number: number;
  weight?: number;
  reps?: number;
  done: boolean;
}

export interface MixedSubLog {
  sub_block_id: string;
  done: boolean;
  actual_value?: number;
  note?: string;
}

export interface BlockExecution {
  block_id: string;
  status: 'done' | 'partial' | 'skipped';
  skip_reason?: string;
  cardio_log?: CardioBlockLog;
  strength_log?: StrengthSetLog[];
  mixed_log?: MixedSubLog[];
}

export type SensationTag = 'easy' | 'solid' | 'hard' | 'cooked';

// ─── Labels & display ─────────────────────────────────────────────────────────
export const MODALITY_LABELS: Record<CardioModality, string> = {
  run: '🏃 Course',
  trail: '🏔️ Trail',
  row: '🚣 Rameur',
  ski_erg: '⛷️ Ski-erg',
  bike: '🚴 Vélo',
  assault: '🥊 Assault Bike',
  walk: '🚶 Marche inclinée',
  other: '⚡ Autre',
};

export const MODALITY_ICONS: Record<CardioModality, string> = {
  run: '🏃', trail: '🏔️', row: '🚣', ski_erg: '⛷️',
  bike: '🚴', assault: '🥊', walk: '🚶', other: '⚡',
};

export const FORMAT_LABELS: Record<StrengthFormat, string> = {
  straight: 'Séries classiques',
  superset: 'Superset / Tri-set',
  amrap: 'AMRAP',
  emom: 'EMOM',
  for_time: 'For Time',
  rounds: 'Rounds for Reps',
};

export const BLOCK_TYPE_LABELS: Record<HybridBlockType, string> = {
  cardio: 'Cardio',
  strength: 'Force',
  mixed: 'Station mixte',
  warmup: 'Échauffement',
  cooldown: 'Retour au calme',
};

export const BLOCK_TYPE_ICONS: Record<HybridBlockType, string> = {
  cardio: '🏃', strength: '💪', mixed: '🔥', warmup: '🌡️', cooldown: '🧊',
};

export const BLOCK_TYPE_COLORS: Record<HybridBlockType, string> = {
  cardio:   'bg-sky-500/15 text-sky-600 border-sky-500/25',
  strength: 'bg-violet-500/15 text-violet-600 border-violet-500/25',
  mixed:    'bg-orange-500/15 text-orange-600 border-orange-500/25',
  warmup:   'bg-yellow-500/15 text-yellow-600 border-yellow-500/25',
  cooldown: 'bg-blue-400/15 text-blue-500 border-blue-400/25',
};

export const INTENT_LABELS: Record<IntentTag, string> = {
  ef: 'Endurance fondamentale',
  seuil: 'Seuil lactique',
  vma: 'VMA / VO2max',
  recup: 'Récupération active',
};

export const SENSATION_CONFIG: Record<SensationTag, { label: string; emoji: string }> = {
  easy:   { label: 'Easy', emoji: '😎' },
  solid:  { label: 'Solide', emoji: '💪' },
  hard:   { label: 'Dur', emoji: '🥵' },
  cooked: { label: 'À la masse', emoji: '🪦' },
};

export const RPE_LABELS: Record<number, string> = {
  1: 'Repos absolu',
  2: 'Très facile',
  3: 'Facile',
  4: 'Confortable',
  5: 'Modéré',
  6: 'Soutenu',
  7: 'Soutenu mais soutenable',
  8: 'Très difficile',
  9: 'Extrême',
  10: 'Max absolu',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Format pace seconds/km as "mm:ss /km" */
export function formatPace(s: number | null | undefined): string {
  if (!s || s <= 0) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60).toString().padStart(2, '0');
  return `${m}:${sec} /km`;
}

/** Format seconds as "Xmin" or "mm:ss" */
export function formatDuration(s: number | null | undefined): string {
  if (!s || s <= 0) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (sec === 0) return `${m} min`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Estimated total duration in seconds for a hybrid session */
export function estimatedSessionDuration(blocks: HybridBlock[]): number {
  return blocks.reduce((total, block) => {
    if (block.cardio) {
      if (block.cardio.mode === 'time') return total + (block.cardio.target_duration_s || 0);
      if (block.cardio.mode === 'distance' && block.cardio.target_distance_m && block.cardio.target_pace_s)
        return total + (block.cardio.target_distance_m / 1000) * block.cardio.target_pace_s;
      if (block.cardio.mode === 'intervals' && block.cardio.repeats && block.cardio.interval) {
        const work = block.cardio.interval.work_duration_s || 120;
        const rec = block.cardio.interval.recovery_duration_s || 60;
        return total + block.cardio.repeats * (work + rec);
      }
    }
    if (block.strength) {
      if (block.strength.duration_s) return total + block.strength.duration_s;
      const setsPerEx = block.strength.exercises[0]?.sets || 3;
      return total + setsPerEx * 60 * 1.5;
    }
    if (block.sub_blocks) return total + block.sub_blocks.length * 120;
    return total;
  }, 0);
}

/** One-line text summary of a block for display in lists */
export function blockSummary(block: HybridBlock): string {
  if (block.cardio) {
    const { modality, mode } = block.cardio;
    const icon = MODALITY_ICONS[modality];
    if (mode === 'distance' && block.cardio.target_distance_m)
      return `${icon} ${block.cardio.target_distance_m >= 1000 ? (block.cardio.target_distance_m / 1000).toFixed(1) + ' km' : block.cardio.target_distance_m + ' m'}`;
    if (mode === 'time' && block.cardio.target_duration_s)
      return `${icon} ${formatDuration(block.cardio.target_duration_s)}${block.cardio.target_zone ? ' Z' + block.cardio.target_zone : ''}`;
    if (mode === 'intervals' && block.cardio.repeats)
      return `${icon} ${block.cardio.repeats}×${block.cardio.interval?.work_distance_m ? block.cardio.interval.work_distance_m + 'm' : formatDuration(block.cardio.interval?.work_duration_s)}`;
  }
  if (block.strength) {
    const ex = block.strength.exercises[0];
    if (!ex) return FORMAT_LABELS[block.strength.format];
    const label = ex.sets ? `${ex.sets}×${ex.reps_min === ex.reps_max ? ex.reps_min : ex.reps_min + '-' + ex.reps_max}` : '';
    return `💪 ${label} ${ex.name}${block.strength.exercises.length > 1 ? ` +${block.strength.exercises.length - 1}` : ''}`;
  }
  if (block.sub_blocks) return `🔥 ${block.sub_blocks.length} mini-blocs`;
  return BLOCK_TYPE_LABELS[block.type];
}

// ─── Templates ────────────────────────────────────────────────────────────────
export interface HybridTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimated_min: number;
  blocks: Omit<HybridBlock, 'id'>[];
}

const mkId = () => Math.random().toString(36).slice(2, 9);

export const HYBRID_TEMPLATES: HybridTemplate[] = [
  {
    id: 'hyrox_short',
    name: 'Hyrox Sim — Short',
    description: '4 runs 1 km + 4 stations',
    icon: '🏆',
    estimated_min: 45,
    blocks: [
      { type: 'warmup', name: 'Échauffement', cardio: { modality: 'run', mode: 'time', target_duration_s: 600, target_zone: 1 } },
      { type: 'cardio', name: 'Run 1', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Wall Balls', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Wall Ball', sets: 1, reps_min: 50, reps_max: 50, suggested_weight: 9 }] } },
      { type: 'cardio', name: 'Run 2', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Burpees Broad Jumps', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Burpee Broad Jump', sets: 1, reps_min: 30, reps_max: 30 }] } },
      { type: 'cardio', name: 'Run 3', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Farmers Carry', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Farmer Carry', sets: 1, reps_min: 200, reps_max: 200, suggested_weight: 24, notes: '200m total' }] } },
      { type: 'cardio', name: 'Run 4', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 8 } },
      { type: 'strength', name: 'Sled Push', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Sled Push', sets: 1, reps_min: 50, reps_max: 50, suggested_weight: 50, notes: '50m' }] } },
      { type: 'cooldown', name: 'Retour au calme', cardio: { modality: 'walk', mode: 'time', target_duration_s: 300, target_zone: 1 } },
    ],
  },
  {
    id: 'hyrox_full',
    name: 'Hyrox Sim — Full',
    description: '8 runs 1 km + 8 stations officielles',
    icon: '🥇',
    estimated_min: 75,
    blocks: [
      { type: 'warmup', name: 'Échauffement', cardio: { modality: 'run', mode: 'time', target_duration_s: 600, target_zone: 1 } },
      { type: 'cardio', name: 'Run 1', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'SkiErg 1000m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Ski-Erg', sets: 1, reps_min: 1000, reps_max: 1000, notes: '1000m' }] } },
      { type: 'cardio', name: 'Run 2', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Sled Push 50m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Sled Push', sets: 1, reps_min: 50, reps_max: 50, suggested_weight: 102, notes: '50m (102 kg H / 72 kg F)' }] } },
      { type: 'cardio', name: 'Run 3', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Sled Pull 50m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Sled Pull', sets: 1, reps_min: 50, reps_max: 50, suggested_weight: 102, notes: '50m' }] } },
      { type: 'cardio', name: 'Run 4', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 7 } },
      { type: 'strength', name: 'Burpees Broad Jumps', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Burpee Broad Jump', sets: 1, reps_min: 80, reps_max: 80 }] } },
      { type: 'cardio', name: 'Run 5', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 8 } },
      { type: 'strength', name: 'Rowing 1000m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Rameur', sets: 1, reps_min: 1000, reps_max: 1000, notes: '1000m' }] } },
      { type: 'cardio', name: 'Run 6', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 8 } },
      { type: 'strength', name: 'Farmers Carry 200m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Farmer Carry', sets: 1, reps_min: 200, reps_max: 200, suggested_weight: 24, notes: '200m' }] } },
      { type: 'cardio', name: 'Run 7', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 8 } },
      { type: 'strength', name: 'Sandbag Lunges 100m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Sandbag Lunge', sets: 1, reps_min: 100, reps_max: 100, suggested_weight: 20, notes: '100m' }] } },
      { type: 'cardio', name: 'Run 8', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000, target_rpe: 9 } },
      { type: 'strength', name: 'Wall Balls 100 reps', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Wall Ball', sets: 1, reps_min: 100, reps_max: 100, suggested_weight: 9 }] } },
    ],
  },
  {
    id: 'endurance_strength',
    name: 'Endurance + Force',
    description: '30 min run Z2 + squat + accessoires',
    icon: '🏋️',
    estimated_min: 65,
    blocks: [
      { type: 'warmup', name: 'Échauffement mobilité', cardio: { modality: 'run', mode: 'time', target_duration_s: 600, target_zone: 1, intent_tag: 'ef' } },
      { type: 'cardio', name: 'Footing EF 30min', cardio: { modality: 'run', mode: 'time', target_duration_s: 1800, target_zone: 2, intent_tag: 'ef', notes: 'Rythme conversationnel, pas de montre nécessaire' } },
      { type: 'strength', name: 'Squat lourd', strength: { format: 'straight', exercises: [{ id: mkId(), name: 'Back Squat', sets: 4, reps_min: 5, reps_max: 6, rpe_target: 8, rest_s: 180 }] } },
      { type: 'strength', name: 'Accessoires', strength: { format: 'superset', exercises: [
        { id: mkId(), name: 'Romanian Deadlift', sets: 3, reps_min: 10, reps_max: 12, rest_s: 90, group: 'A1' },
        { id: mkId(), name: 'Hip Thrust', sets: 3, reps_min: 12, reps_max: 15, rest_s: 90, group: 'A2' },
      ] } },
      { type: 'cooldown', name: 'Étirements 10min', cardio: { modality: 'walk', mode: 'time', target_duration_s: 600, target_zone: 1 } },
    ],
  },
  {
    id: 'emom_conditioning',
    name: 'Conditioning EMOM 20',
    description: 'EMOM 20 min alternant cardio et force',
    icon: '⏱️',
    estimated_min: 35,
    blocks: [
      { type: 'warmup', name: 'Activation 10min', cardio: { modality: 'run', mode: 'time', target_duration_s: 600, target_zone: 1 } },
      {
        type: 'mixed',
        name: 'EMOM 20 min',
        sub_blocks: [
          { id: mkId(), type: 'cardio', label: 'Min impaires — Calorie Bike 12 cal', cardio: { modality: 'assault', mode: 'time', target_duration_s: 45, target_rpe: 8 } },
          { id: mkId(), type: 'strength', label: 'Min paires — Kettlebell Swing 15 reps', exercise: { id: mkId(), name: 'Kettlebell Swing', sets: 1, reps_min: 15, reps_max: 15, suggested_weight: 24 } },
        ],
      },
      { type: 'cooldown', name: 'Récup active', cardio: { modality: 'walk', mode: 'time', target_duration_s: 300, target_zone: 1 } },
    ],
  },
  {
    id: 'vma_core',
    name: 'VMA + Core',
    description: '8×400m récup 1min + circuit core 3 tours',
    icon: '⚡',
    estimated_min: 50,
    blocks: [
      { type: 'warmup', name: 'Échauffement 15min', cardio: { modality: 'run', mode: 'time', target_duration_s: 900, target_zone: 1, intent_tag: 'ef' } },
      {
        type: 'cardio',
        name: '8 × 400m VMA',
        cardio: {
          modality: 'run', mode: 'intervals', repeats: 8,
          interval: { work_distance_m: 400, zone: 5, recovery_type: 'active', recovery_duration_s: 60 },
          intent_tag: 'vma', notes: 'Allure 5km, récup trot lent 1min',
        },
      },
      {
        type: 'strength',
        name: 'Circuit Core × 3',
        strength: {
          format: 'rounds', rounds: 3,
          exercises: [
            { id: mkId(), name: 'Planche', sets: 3, reps_min: 45, reps_max: 60, notes: '45-60 sec' },
            { id: mkId(), name: 'Crunch bicyclette', sets: 3, reps_min: 20, reps_max: 20 },
            { id: mkId(), name: 'Dead Bug', sets: 3, reps_min: 10, reps_max: 10 },
          ],
        },
      },
      { type: 'cooldown', name: 'Retour au calme + étirements', cardio: { modality: 'walk', mode: 'time', target_duration_s: 600, target_zone: 1 } },
    ],
  },
  {
    id: 'recup_active',
    name: 'Récupération active',
    description: '40 min Z1 + mobilité 15 min',
    icon: '🧊',
    estimated_min: 55,
    blocks: [
      { type: 'cardio', name: 'Footing très facile 40min', cardio: { modality: 'run', mode: 'time', target_duration_s: 2400, target_zone: 1, intent_tag: 'recup', notes: 'Très facile, conversation possible, no watch' } },
      {
        type: 'strength',
        name: 'Mobilité & relâchement',
        strength: {
          format: 'straight',
          exercises: [
            { id: mkId(), name: 'Hip flexor stretch', sets: 2, reps_min: 60, reps_max: 60, notes: '60 sec chaque côté' },
            { id: mkId(), name: 'Pigeon pose', sets: 2, reps_min: 90, reps_max: 90, notes: '90 sec chaque côté' },
            { id: mkId(), name: 'Cat-Cow', sets: 2, reps_min: 10, reps_max: 10 },
          ],
        },
      },
    ],
  },
  {
    id: 'test_hyrox',
    name: 'Test Hyrox Benchmark',
    description: 'Protocole standardisé pour se chronomètrer',
    icon: '🔬',
    estimated_min: 60,
    blocks: [
      { type: 'warmup', name: 'Échauffement protocole 15min', cardio: { modality: 'run', mode: 'time', target_duration_s: 900, target_zone: 1, notes: 'Inclure 3×20sec accélérations' } },
      { type: 'cardio', name: 'Run 1 km', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000 } },
      { type: 'strength', name: 'SkiErg 1000m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Ski-Erg', sets: 1, reps_min: 1000, reps_max: 1000 }] } },
      { type: 'cardio', name: 'Run 1 km', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000 } },
      { type: 'strength', name: 'Sled Push 50m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Sled Push', sets: 1, reps_min: 50, reps_max: 50, suggested_weight: 102 }] } },
      { type: 'cardio', name: 'Run 1 km', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000 } },
      { type: 'strength', name: 'Burpees Broad Jumps 30 reps', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Burpee Broad Jump', sets: 1, reps_min: 30, reps_max: 30 }] } },
      { type: 'cardio', name: 'Run 1 km', cardio: { modality: 'run', mode: 'distance', target_distance_m: 1000 } },
      { type: 'strength', name: 'Rowing 500m', strength: { format: 'for_time', exercises: [{ id: mkId(), name: 'Rameur', sets: 1, reps_min: 500, reps_max: 500 }] } },
    ],
  },
];