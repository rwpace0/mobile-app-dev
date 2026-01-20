import { useState, useEffect, useRef } from "react";
import { useSettings } from "../../../state/SettingsContext";
import { hapticLight, hapticMedium, hapticSuccess } from "../../../utils/hapticFeedback";
import { parseTimeInput } from "../../../utils/timerUtils";

/**
 * Custom hook for managing exercise state (sets, notes, etc.)
 * @param {Object} exercise - Exercise object
 * @param {Object} initialState - Initial state from restored workout
 * @param {Function} onUpdateTotals - Callback to update totals
 * @param {Function} onStateChange - Callback when state changes
 * @param {Function} onTimerStart - Callback to start exercise timer
 * @param {Object} previousWorkoutSets - Previous workout sets for reference
 * @param {Object} timerHandlers - Timer handlers from useSetTimers hook
 * @returns {Object} State and handlers for exercise
 */
export const useExerciseState = (
  exercise,
  initialState,
  onUpdateTotals,
  onStateChange,
  onTimerStart,
  previousWorkoutSets,
  timerHandlers
) => {
  const { showPreviousPerformance, restTimerEnabled, timerType } = useSettings();
  // Generate unique keys for sets - use a ref to track the next key
  const nextUniqueKeyRef = useRef(1);
  
  // Ensure all sets have unique keys and advance the ref past any existing keys
  const ensureSetKeys = (setsArray) => {
    // First, scan existing keys so we never reuse a key value
    setsArray.forEach((set) => {
      if (set.key && typeof set.key === "string") {
        const match = set.key.match(/^set-(\d+)$/);
        if (match) {
          const numericPart = parseInt(match[1], 10);
          if (!Number.isNaN(numericPart)) {
            nextUniqueKeyRef.current = Math.max(
              nextUniqueKeyRef.current,
              numericPart + 1
            );
          }
        }
      }
    });

    // Then, assign keys to any sets that are missing them
    return setsArray.map((set) => {
      if (!set.key) {
        return { ...set, key: `set-${nextUniqueKeyRef.current++}` };
      }
      return set;
    });
  };
  
  const [sets, setSets] = useState(() => {
    const initialSets = initialState?.sets || exercise.sets || [];
    return ensureSetKeys(initialSets);
  });
  const [notes, setNotes] = useState(initialState?.notes || "");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [hasPrefilledData, setHasPrefilledData] = useState(!!initialState?.sets);
  const inputRefs = useRef({});

  // Update state when initialState prop changes (for restored workouts)
  // Use a ref to track previous initialState to avoid loops
  const prevInitialStateRef = useRef(initialState);
  useEffect(() => {
    // Only update if initialState actually changed
    if (prevInitialStateRef.current === initialState) return;
    
    const prevStateString = JSON.stringify(prevInitialStateRef.current);
    const currentStateString = JSON.stringify(initialState);
    
    if (currentStateString !== prevStateString) {
      prevInitialStateRef.current = initialState;
      
      if (initialState?.sets && initialState.sets.length > 0) {
        setSets(ensureSetKeys(initialState.sets));
        setHasPrefilledData(true);
      }
      if (initialState?.notes !== undefined) {
        setNotes(initialState.notes);
      }
    }
  }, [initialState]);

  // Use refs for callbacks to avoid dependency issues
  const onUpdateTotalsRef = useRef(onUpdateTotals);
  useEffect(() => {
    onUpdateTotalsRef.current = onUpdateTotals;
  }, [onUpdateTotals]);

  // Track previous totals to avoid unnecessary calls
  const prevTotalsRef = useRef({ volume: 0, sets: 0 });
  
  // Update total completed sets whenever sets change
  useEffect(() => {
    const completedSets = sets.filter(
      (set) => set.completed && set.id !== "W"
    ).length;
    const totalVolume = sets.reduce((acc, set) => {
      if (set.completed && set.id !== "W") {
        return acc + (parseFloat(set.total) || 0);
      }
      return acc;
    }, 0);
    
    // Only call if totals actually changed
    if (totalVolume !== prevTotalsRef.current.volume || completedSets !== prevTotalsRef.current.sets) {
      prevTotalsRef.current = { volume: totalVolume, sets: completedSets };
      onUpdateTotalsRef.current(exercise.exercise_id, totalVolume, completedSets);
    }
  }, [sets, exercise.exercise_id]); // Removed onUpdateTotals from dependencies

  // Call onStateChange whenever sets, notes, or setTimers change
  // Use refs to avoid dependency issues with callbacks
  const timerHandlersRef = useRef(timerHandlers);
  const onStateChangeRef = useRef(onStateChange);
  
  // Update refs without triggering effects
  timerHandlersRef.current = timerHandlers;
  onStateChangeRef.current = onStateChange;
  
  // Track previous state to avoid unnecessary calls
  const prevStateKeyRef = useRef("");
  
  // Single effect that checks all state changes
  useEffect(() => {
    if (!onStateChangeRef.current) return;
    
    const currentSetTimers = timerHandlersRef.current?.setTimers || {};
    
    // Create a stable key for comparison
    const setsKey = JSON.stringify(sets.map(s => ({ id: s.id, weight: s.weight, reps: s.reps, rir: s.rir, completed: s.completed })));
    const timersKey = JSON.stringify(currentSetTimers);
    const currentStateKey = `${setsKey}|${notes}|${timersKey}`;
    
    if (currentStateKey !== prevStateKeyRef.current) {
      prevStateKeyRef.current = currentStateKey;
      onStateChangeRef.current({ sets, notes, setTimers: currentSetTimers });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, notes]); // Only depend on sets and notes - setTimers checked via ref

  const handleWeightChange = (id, value) => {
    // Allow only numbers and one decimal point, max 7 characters (e.g., "9999.5")
    const sanitized = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = sanitized.split(".");
    const filtered =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : sanitized;
    // Limit to 7 characters
    const limited = filtered.length > 7 ? filtered.slice(0, 7) : filtered;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(limited) || 0;
          const reps = parseFloat(set.reps) || 0;
          return {
            ...set,
            weight: limited,
            total: Math.round(weight * reps).toString(),
            // Preserve key
            key: set.key,
          };
        }
        return set;
      })
    );
  };

  const handleRepsChange = (id, value) => {
    // Allow whole numbers and "-" for ranges (e.g., "1-2"), max 7 characters
    const sanitized = value.replace(/[^0-9-]/g, "");
    // Ensure only one dash
    const parts = sanitized.split("-");
    const filtered =
      parts.length > 2 ? parts[0] + "-" + parts.slice(1).join("") : sanitized;
    const limited = filtered.length > 7 ? filtered.slice(0, 7) : filtered;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(set.weight) || 0;
          // For range format "1-2", use the first number for total calculation
          const repsMatch = limited.match(/^(\d+)/);
          const reps = repsMatch ? parseFloat(repsMatch[1]) : 0;
          return {
            ...set,
            reps: limited,
            total: Math.round(weight * reps).toString(),
            // Preserve key
            key: set.key,
          };
        }
        return set;
      })
    );
  };

  const handleRirChange = (id, value) => {
    // Allow whole numbers and "-" for ranges (e.g., "1-2"), max 5 characters
    const sanitized = value.replace(/[^0-9-]/g, "");
    // Ensure only one dash
    const parts = sanitized.split("-");
    const filtered =
      parts.length > 2 ? parts[0] + "-" + parts.slice(1).join("") : sanitized;
    const limited = filtered.length > 5 ? filtered.slice(0, 5) : filtered;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          return {
            ...set,
            rir: limited,
            // Preserve key
            key: set.key,
          };
        }
        return set;
      })
    );
  };

  const handleAddSet = () => {
    hapticLight();
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const newSetId =
      sets.length > 0 && lastSet.id !== "W"
        ? (parseInt(lastSet.id) + 1).toString()
        : "1";

    const newSet = {
      id: newSetId,
      key: `set-${nextUniqueKeyRef.current++}`, // Stable unique identifier
      weight: "",
      reps: "",
      rir: "",
      total: "",
      completed: false,
    };
    setSets([...sets, newSet]);

    // Initialize set timer with default value (copy from last set or use default)
    if (timerHandlers) {
      const defaultTimer =
        lastSet && timerHandlers.setTimers[lastSet.id]
          ? timerHandlers.setTimers[lastSet.id]
          : timerHandlers.DEFAULT_SET_TIMER;
      timerHandlers.initializeTimerForNewSet(newSetId, defaultTimer);
    }
  };

  const handleDeleteSet = (setId) => {
    hapticMedium();
    setSets((prev) => {
      // Filter out the deleted set
      const filtered = prev.filter((set) => set.id !== setId);
      // Renumber regular sets (skip warmup sets with id "W")
      // Preserve the unique 'key' property for React reconciliation
      let setNumber = 1;
      return filtered.map((set) => {
        if (set.id === "W") {
          // Keep warmup sets as-is
          return set;
        } else {
          // Renumber regular sets sequentially
          // Keep the original 'key' property for stable React keys
          const newId = setNumber.toString();
          setNumber++;
          return {
            ...set,
            id: newId,
            // Preserve key if it exists, otherwise generate one
            key: set.key || `set-${nextUniqueKeyRef.current++}`,
          };
        }
      });
    });
  };

  const toggleSetCompletion = (index) => {
    // Check if any input in this set has focus
    const currentSet = sets[index];
    const hasKeyboardOpen =
      inputRefs.current[currentSet.id]?.weight?.isFocused() ||
      inputRefs.current[currentSet.id]?.reps?.isFocused() ||
      inputRefs.current[currentSet.id]?.rir?.isFocused();

    setSets((prev) =>
      prev.map((set, idx) => {
        if (idx === index) {
          const newSet = { ...set, completed: !set.completed, key: set.key };

          // Use success haptic when completing, light when uncompleting
          if (newSet.completed && !set.completed) {
            hapticSuccess();

            // Get corresponding previous set for this index
            const correspondingPreviousSet = previousWorkoutSets[index];

            // If weight is empty, populate with historical data
            let updatedWeight = String(newSet.weight || "").trim();
            if (
              !updatedWeight &&
              showPreviousPerformance &&
              correspondingPreviousSet
            ) {
              updatedWeight = String(correspondingPreviousSet.weight);
            }

            // If reps is empty, populate with template or historical data
            let updatedReps = String(newSet.reps || "").trim();
            if (!updatedReps) {
              // Check for template range first
              if (
                exercise.rep_range_min !== null &&
                exercise.rep_range_min !== undefined &&
                exercise.rep_range_max !== null &&
                exercise.rep_range_max !== undefined
              ) {
                updatedReps = `${exercise.rep_range_min}-${exercise.rep_range_max}`;
              } else if (showPreviousPerformance && correspondingPreviousSet) {
                updatedReps = String(correspondingPreviousSet.reps);
              }
            }

            // If rir is empty, populate with template or historical data
            let updatedRir = String(newSet.rir || "").trim();
            if (!updatedRir) {
              // Check for template range first
              if (
                exercise.rir_range_min !== null &&
                exercise.rir_range_min !== undefined &&
                exercise.rir_range_max !== null &&
                exercise.rir_range_max !== undefined
              ) {
                updatedRir = `${exercise.rir_range_min}-${exercise.rir_range_max}`;
              } else if (showPreviousPerformance && correspondingPreviousSet) {
                if (
                  correspondingPreviousSet.rir !== null &&
                  correspondingPreviousSet.rir !== undefined
                ) {
                  updatedRir = String(correspondingPreviousSet.rir);
                }
              }
            }

            // Convert ranges to first number when completing set
            // Check if reps contains a range (e.g., "1-2")
            if (updatedReps.includes("-")) {
              const repsMatch = updatedReps.match(/^(\d+)/);
              if (repsMatch && repsMatch[1]) {
                updatedReps = repsMatch[1];
              }
            }

            // Check if rir contains a range (e.g., "1-2")
            if (updatedRir.includes("-")) {
              const rirMatch = updatedRir.match(/^(\d+)/);
              if (rirMatch && rirMatch[1]) {
                updatedRir = rirMatch[1];
              }
            }

            // Update weight, reps, and recalculate total
            const weight = parseFloat(updatedWeight) || 0;
            const reps = parseFloat(updatedReps) || 0;
            newSet.weight = updatedWeight;
            newSet.reps = updatedReps;
            newSet.total = Math.round(weight * reps).toString();

            // Always update rir
            newSet.rir = updatedRir;
            
            // Ensure key is preserved
            newSet.key = set.key;
          } else {
            hapticLight();
          }

          // If completing the set and keyboard was open, focus next set
          if (newSet.completed && !set.completed && hasKeyboardOpen) {
            // Find next incomplete set
            setTimeout(() => {
              const nextIncompleteIndex = prev.findIndex(
                (s, i) => i > index && !s.completed
              );
              if (nextIncompleteIndex !== -1) {
                const nextSet = prev[nextIncompleteIndex];
                // Focus weight input of next set
                inputRefs.current[nextSet.id]?.weight?.focus();
              }
            }, 100); // Small delay to ensure state updates
          }

          // Handle rest timer based on settings
          if (newSet.completed && !set.completed && restTimerEnabled) {
            if (timerType === "exercise" && onTimerStart) {
              // Exercise timer mode - start global timer
              onTimerStart(restTime);
            } else if (timerType === "set" && timerHandlers) {
              // Set timer mode - start per-set countdown
              timerHandlers.startSetTimer(set.id);
            }
          } else if (!newSet.completed && set.completed) {
            // If uncompleting a set, stop its timer
            if (timerType === "set" && timerHandlers) {
              timerHandlers.stopSetTimer(set.id);
            }
          }

          return newSet;
        }
        return set;
      })
    );
  };

  const handleRestTimeSelect = (seconds) => {
    hapticLight();
    setRestTime(seconds);
  };

  // Initialize sets from previous workout if needed
  const initializeSets = (initialSets) => {
    if (initialSets && !hasPrefilledData && sets.length === 0) {
      setSets(ensureSetKeys(initialSets));
      setHasPrefilledData(true);
    } else if (!hasPrefilledData && sets.length === 0) {
      // Ensure at least one empty set exists
      setSets([
        {
          id: "1",
          key: `set-${nextUniqueKeyRef.current++}`,
          weight: "",
          reps: "",
          rir: "",
          total: "",
          completed: false,
        },
      ]);
      setHasPrefilledData(true);
    }
  };

  return {
    sets,
    notes,
    restTime,
    hasPrefilledData,
    inputRefs,
    setSets,
    setNotes,
    setHasPrefilledData,
    handleWeightChange,
    handleRepsChange,
    handleRirChange,
    handleAddSet,
    handleDeleteSet,
    toggleSetCompletion,
    handleRestTimeSelect,
    initializeSets,
  };
};
