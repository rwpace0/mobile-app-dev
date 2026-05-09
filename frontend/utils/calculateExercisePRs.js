/**
 * Calculates a single set's performance score: weight × reps × RIR (defaulting RIR to 1 when absent).
 */
export function calculateSetPerformance(set) {
  return (
    (set.weight || 0) *
    (set.reps || 0) *
    (set.rir !== null && set.rir !== undefined ? set.rir : 1)
  );
}

/**
 * Two-pass PR calculation over a full exercise history array.
 *
 * Pass 1 — find the highest performance value across all history.
 * Pass 2 — find the most recent workout entry that achieved that value and
 *           collect every set_id within it that matched.
 *
 * @param {Array} history - Array of workout entries, each with a `sets` array.
 *   Assumed to be ordered most-recent-first.
 * @returns {{ performance: number, workoutId: string|null, setIds: Set }} or null
 *   when history is empty.
 */
export function calculateExercisePR(history) {
  if (!history || history.length === 0) return null;

  let bestPerformance = 0;

  // Pass 1: find the best performance value
  history.forEach((entry) => {
    entry.sets?.forEach((set) => {
      const performance = calculateSetPerformance(set);
      if (performance > bestPerformance) {
        bestPerformance = performance;
      }
    });
  });

  let bestWorkoutId = null;
  const bestSetIds = new Set();

  // Pass 2: find the most recent workout that achieved this performance
  for (const entry of history) {
    if (!entry.sets || entry.sets.length === 0) continue;

    const entryHasPR = entry.sets.some(
      (set) => calculateSetPerformance(set) === bestPerformance
    );

    if (entryHasPR) {
      bestWorkoutId = entry.workout_exercises_id;
      entry.sets.forEach((set) => {
        if (calculateSetPerformance(set) === bestPerformance) {
          bestSetIds.add(set.set_id);
        }
      });
      break;
    }
  }

  return {
    performance: bestPerformance,
    workoutId: bestWorkoutId,
    setIds: bestSetIds,
  };
}

/**
 * Checks whether the most recent workout entry in history (history[0]) achieved
 * an all-time PR for this exercise.
 *
 * Used by workoutComplete to determine if a just-saved workout set a new record.
 *
 * @param {Array} history - Array of workout entries ordered most-recent-first.
 * @returns {boolean}
 */
export function checkCurrentWorkoutPR(history) {
  if (!history || history.length === 0) return false;

  let bestPerformance = 0;
  history.forEach((entry) => {
    entry.sets?.forEach((set) => {
      const perf = calculateSetPerformance(set);
      if (perf > bestPerformance) bestPerformance = perf;
    });
  });

  if (bestPerformance === 0) return false;

  const currentEntry = history[0];
  return (
    currentEntry.sets?.some(
      (set) => calculateSetPerformance(set) === bestPerformance
    ) ?? false
  );
}
