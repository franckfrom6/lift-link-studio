import { useMemo, useCallback, useState, useEffect } from "react";

type SearchableExercise = {
  id: string;
  name: string;
  name_en?: string | null;
  muscle_group: string;
  equipment: string;
  secondary_muscle?: string | null;
  description?: string | null;
  is_default?: boolean;
  created_by?: string | null;
  [key: string]: any;
};

interface NormalizedExercise<T extends SearchableExercise> {
  exercise: T;
  _name: string;
  _nameEn: string;
  _muscle: string;
  _equipment: string;
  _secondary: string;
  _description: string;
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function scoreExercise<T extends SearchableExercise>(
  n: NormalizedExercise<T>,
  query: string,
  isCustom: boolean
): number {
  let score = 0;

  // Exact match on name
  if (n._name === query || n._nameEn === query) return 1000 + (isCustom ? 1 : 0);

  // startsWith on name
  if (n._name.startsWith(query) || n._nameEn.startsWith(query)) score = Math.max(score, 800);

  // includes on name/name_en
  if (n._name.includes(query) || n._nameEn.includes(query)) score = Math.max(score, 600);

  // Word boundary match on name (e.g. "curl" matches "Leg curl")
  if (score < 600) {
    const nameWords = n._name.split(/\s+/);
    const nameEnWords = n._nameEn.split(/\s+/);
    if (nameWords.some(w => w.startsWith(query)) || nameEnWords.some(w => w.startsWith(query))) {
      score = Math.max(score, 500);
    }
  }

  // muscle_group or equipment
  if (n._muscle.includes(query) || n._equipment.includes(query)) score = Math.max(score, 300);

  // secondary_muscle
  if (n._secondary.includes(query)) score = Math.max(score, 200);

  // description
  if (n._description.includes(query)) score = Math.max(score, 100);

  // Custom exercises get a tiny boost at equal score
  if (score > 0 && isCustom) score += 1;

  return score;
}

/**
 * Highlight matching text in a string. Returns an array of {text, bold} segments.
 */
export function highlightMatch(text: string, query: string): { text: string; bold: boolean }[] {
  if (!query.trim()) return [{ text, bold: false }];

  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const idx = normalizedText.indexOf(normalizedQuery);

  if (idx === -1) return [{ text, bold: false }];

  return [
    { text: text.slice(0, idx), bold: false },
    { text: text.slice(idx, idx + normalizedQuery.length), bold: true },
    { text: text.slice(idx + normalizedQuery.length), bold: false },
  ].filter(s => s.text.length > 0);
}

export function useExerciseSearch<T extends SearchableExercise>(
  exercises: T[],
  options?: { userId?: string; debounceMs?: number }
) {
  const userId = options?.userId;
  const debounceMs = options?.debounceMs ?? 200;

  const normalized = useMemo<NormalizedExercise<T>[]>(
    () =>
      exercises.map((ex) => ({
        exercise: ex,
        _name: normalize(ex.name),
        _nameEn: normalize(ex.name_en || ""),
        _muscle: normalize(ex.muscle_group),
        _equipment: normalize(ex.equipment),
        _secondary: normalize(ex.secondary_muscle || ""),
        _description: normalize(ex.description || ""),
      })),
    [exercises]
  );

  const search = useCallback(
    (query: string): T[] => {
      const q = normalize(query);
      if (!q) return exercises;

      // Split multi-word queries for better matching
      const results: { exercise: T; score: number }[] = [];

      for (const n of normalized) {
        const isCustom = !n.exercise.is_default && !!n.exercise.created_by && n.exercise.created_by === userId;
        const s = scoreExercise(n, q, isCustom);
        if (s > 0) results.push({ exercise: n.exercise, score: s });
      }

      results.sort((a, b) => b.score - a.score);
      return results.map((r) => r.exercise);
    },
    [normalized, exercises, userId]
  );

  // Debounced search state helper
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const results = useMemo(() => search(debouncedQuery), [search, debouncedQuery]);

  return { search, query, setQuery, debouncedQuery, results, highlightMatch };
}
