import { SessionExerciseData } from "@/types/coach";

/**
 * Toggle a bi-set (superset) link between two adjacent exercises in a list.
 *
 * - If the two are already linked together, both are unlinked (group = null).
 * - Otherwise, both are assigned the next free group integer for that list.
 */
export function toggleBiSet(
  exercises: SessionExerciseData[],
  index: number,
): SessionExerciseData[] {
  const a = exercises[index];
  const b = exercises[index + 1];
  if (!a || !b) return exercises;

  const alreadyLinked =
    a.supersetGroup != null && a.supersetGroup === b.supersetGroup;

  if (alreadyLinked) {
    return exercises.map((e, i) =>
      i === index || i === index + 1 ? { ...e, supersetGroup: null } : e,
    );
  }

  const used = new Set<number>();
  for (const e of exercises) {
    if (typeof e.supersetGroup === "number") used.add(e.supersetGroup);
  }
  let g = 1;
  while (used.has(g)) g++;

  return exercises.map((e, i) =>
    i === index || i === index + 1 ? { ...e, supersetGroup: g } : e,
  );
}

export function isLinkedToNext(
  exercises: SessionExerciseData[],
  index: number,
): boolean {
  const a = exercises[index];
  const b = exercises[index + 1];
  return !!(a && b && a.supersetGroup != null && a.supersetGroup === b.supersetGroup);
}