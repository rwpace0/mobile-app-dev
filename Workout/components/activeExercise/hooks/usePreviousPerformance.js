import { useState, useEffect } from "react";
import exercisesAPI from "../../../API/exercisesAPI";
import { useWeight } from "../../../utils/useWeight";
import { useSettings } from "../../../state/SettingsContext";

/**
 * Custom hook for fetching and managing previous workout performance data
 * @param {Object} exercise - Exercise object
 * @param {Array} sets - Current sets array
 * @param {boolean} hasPrefilledData - Whether sets have been pre-filled
 * @returns {Object} Previous performance data and loading state
 */
export const usePreviousPerformance = (exercise, sets, hasPrefilledData) => {
  const { showPreviousPerformance } = useSettings();
  const weight = useWeight();
  const [previousPerformance, setPreviousPerformance] = useState(null);
  const [previousWorkoutSets, setPreviousWorkoutSets] = useState([]);
  const [loadingPrevious, setLoadingPrevious] = useState(false);

  useEffect(() => {
    const fetchPreviousPerformance = async () => {
      if (!exercise.exercise_id) return;

      try {
        setLoadingPrevious(true);
        const history = await exercisesAPI.getExerciseHistory(
          exercise.exercise_id
        );

        if (history && history.length > 0) {
          const lastWorkout = history[0]; // Most recent workout
          if (lastWorkout.sets && lastWorkout.sets.length > 0) {
            // Store all previous sets for individual display
            const convertedPreviousSets = lastWorkout.sets.map((set) => {
              const convertedWeight = weight.fromStorage(set.weight);
              const roundedWeight = weight.roundToHalf(convertedWeight);
              return {
                weight: roundedWeight,
                reps: set.reps,
                rir: set.rir,
                total: roundedWeight * (set.reps || 0),
              };
            });
            setPreviousWorkoutSets(convertedPreviousSets);

            // Find the best set (highest total weight moved) for display
            const bestSet = lastWorkout.sets.reduce((best, set) => {
              const currentTotal = (set.weight || 0) * (set.reps || 0);
              const bestTotal = (best.weight || 0) * (best.reps || 0);
              return currentTotal > bestTotal ? set : best;
            });

            // Convert weight from storage to user's preferred unit for display
            const convertedWeight = weight.fromStorage(bestSet.weight);
            // Round to only allow whole numbers and .5 increments
            const roundedWeight = weight.roundToHalf(convertedWeight);
            const performanceData = {
              weight: roundedWeight,
              reps: bestSet.reps,
              total: roundedWeight * (bestSet.reps || 0),
              date: lastWorkout.date_performed || lastWorkout.created_at,
            };
            setPreviousPerformance(performanceData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch previous performance:", error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    fetchPreviousPerformance();
  }, [exercise.exercise_id, showPreviousPerformance]);

  // Generate initial sets based on previous workout
  const generateInitialSets = () => {
    if (hasPrefilledData || sets.length > 0) return null;

    if (previousWorkoutSets.length > 0) {
      return previousWorkoutSets.map((prevSet, index) => ({
        id: (index + 1).toString(),
        key: `set-init-${index}`, // Stable key for initial sets
        weight: "",
        reps: "",
        rir: "",
        total: "",
        completed: false,
      }));
    } else {
      // No previous workout found, add one empty set to get started
      return [
        {
          id: "1",
          key: "set-init-0", // Stable key for initial set
          weight: "",
          reps: "",
          rir: "",
          total: "",
          completed: false,
        },
      ];
    }
  };

  return {
    previousPerformance,
    previousWorkoutSets,
    loadingPrevious,
    generateInitialSets,
  };
};
