import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { SwipeListView } from "react-native-swipe-list-view";
import SwipeToDelete from "../animations/SwipeToDelete";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { getColors } from "../constants/colors";
import { FontSize } from "../constants/theme";
import { createStyles } from "../styles/activeExercise.styles";
import { useTheme, useSettings } from "../state/SettingsContext";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import exercisesAPI from "../API/exercisesAPI";
import { useWeight } from "../utils/useWeight";
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "../utils/hapticFeedback";

const ActiveExerciseComponent = ({
  exercise,
  onUpdateTotals,
  onRemoveExercise,
  onStateChange,
  initialState,
  drag,
  isActive,
  onTimerStart,
}) => {
  const [sets, setSets] = useState(initialState?.sets || exercise.sets || []);
  const [notes, setNotes] = useState(initialState?.notes || "");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [previousPerformance, setPreviousPerformance] = useState(null);
  const [previousWorkoutSets, setPreviousWorkoutSets] = useState([]); // Store all sets from previous workout
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(
    !!initialState?.sets
  );

  // Animation state
  const [contentHeight, setContentHeight] = useState(0);
  const [isContentMeasured, setIsContentMeasured] = useState(false);
  const animatedHeight = useSharedValue(300); // Start with reasonable default height
  const animatedOpacity = useSharedValue(1); // Start visible
  const [needsRemeasurement, setNeedsRemeasurement] = useState(false);

  const { isDark } = useTheme();
  const {
    showPreviousPerformance,
    showRir,
    showNotes,
    restTimerEnabled,
    timerType,
  } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const inputRefs = useRef({});
  const swipeListRef = useRef(null);
  const [imageError, setImageError] = useState(false);

  // Set timer state for per-set timer mode
  const [setTimers, setSetTimers] = useState(initialState?.setTimers || {});
  const [activeSetTimer, setActiveSetTimer] = useState(null);
  const [setTimerRemaining, setSetTimerRemaining] = useState({});
  const timerIntervalRef = useRef(null);

  // Default timer value
  const DEFAULT_SET_TIMER = "3:00";

  // Update state when initialState prop changes (for restored workouts)
  useEffect(() => {
    if (initialState?.sets) {
      setSets(initialState.sets);
      setHasPrefilledData(true);
    }
    if (initialState?.notes) {
      setNotes(initialState.notes);
    }
    if (initialState?.setTimers) {
      setSetTimers(initialState.setTimers);
    }
  }, [initialState]);

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        const details = await exercisesAPI.getExerciseById(
          exercise.exercise_id
        );
        setExerciseDetails(details);
      } catch (error) {
        console.error("Failed to fetch exercise details:", error);
      }
    };

    fetchExerciseDetails();
  }, [exercise.exercise_id]);

  // Fetch previous performance and initialize sets with previous workout count
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

            // Initialize sets based on previous workout if current sets are empty
            if (!hasPrefilledData && sets.length === 0) {
              const initialSets = lastWorkout.sets.map((prevSet, index) => {
                const convertedWeight = weight.fromStorage(prevSet.weight);
                // Round to only allow whole numbers and .5 increments
                const roundedWeight = weight.roundToHalf(convertedWeight);
                return {
                  id: (index + 1).toString(),
                  weight: showPreviousPerformance
                    ? roundedWeight.toString()
                    : "",
                  reps: showPreviousPerformance ? prevSet.reps.toString() : "",
                  rir: "",
                  total: showPreviousPerformance
                    ? Math.round(roundedWeight * prevSet.reps).toString()
                    : "",
                  completed: false,
                };
              });

              setSets(initialSets);
              setHasPrefilledData(true);
            } else if (!hasPrefilledData && showPreviousPerformance) {
              // Pre-fill existing empty sets with previous performance data
              setSets((prevSets) =>
                prevSets.map((set) => {
                  if (!set.weight && !set.reps) {
                    return {
                      ...set,
                      weight: performanceData.weight.toString(),
                      reps: performanceData.reps.toString(),
                      total: Math.round(
                        performanceData.weight * performanceData.reps
                      ).toString(),
                    };
                  }
                  return set;
                })
              );
              setHasPrefilledData(true);
            }
          }
        } else if (!hasPrefilledData && sets.length === 0) {
          // No previous workout found, add one empty set to get started
          setSets([
            {
              id: "1",
              weight: "",
              reps: "",
              rir: "",
              total: "",
              completed: false,
            },
          ]);
          setHasPrefilledData(true);
        }
      } catch (error) {
        console.error("Failed to fetch previous performance:", error);
        // If there's an error and no sets exist, add one empty set
        if (!hasPrefilledData && sets.length === 0) {
          setSets([
            {
              id: "1",
              weight: "",
              reps: "",
              rir: "",
              total: "",
              completed: false,
            },
          ]);
          setHasPrefilledData(true);
        }
      } finally {
        setLoadingPrevious(false);
      }
    };

    fetchPreviousPerformance();
  }, [exercise.exercise_id, hasPrefilledData, showPreviousPerformance]);

  // update total completed sets whenever sets change
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
    onUpdateTotals(exercise.exercise_id, totalVolume, completedSets);

    // Trigger remeasurement when sets change
    setNeedsRemeasurement(true);
  }, [sets]);

  // Initialize set timers for all sets when in set timer mode
  useEffect(() => {
    if (timerType === "set" && sets.length > 0) {
      setSetTimers((prevTimers) => {
        const newTimers = { ...prevTimers };
        sets.forEach((set) => {
          if (!newTimers[set.id]) {
            newTimers[set.id] = DEFAULT_SET_TIMER;
          }
        });
        return newTimers;
      });
    }
  }, [sets, timerType]);

  // Call onStateChange whenever sets, notes, or setTimers change
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ sets, notes, setTimers });
    }
  }, [sets, notes, setTimers]);

  // Update animation values when content height changes
  useEffect(() => {
    if (contentHeight > 0) {
      // Smoothly transition to the actual measured height
      animatedHeight.value = withTiming(contentHeight, { duration: 100 });
    }
  }, [contentHeight]);

  // Handle drag animation
  useEffect(() => {
    if (isActive) {
      // Collapse when dragging
      animatedHeight.value = withTiming(0, { duration: 200 });
      animatedOpacity.value = withTiming(0, { duration: 200 });
    } else {
      // Expand when not dragging - use measured height if available, otherwise use default
      const targetHeight = contentHeight > 0 ? contentHeight : 300;
      animatedHeight.value = withTiming(targetHeight, { duration: 200 });
      animatedOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, contentHeight]);

  const formatTime = (seconds) => {
    if (seconds === 0) return "Off";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Helper function to parse time input (supports seconds or MM:SS format)
  const parseTimeInput = (input) => {
    if (!input || input === "") return 0;
    const cleaned = input.trim();

    // If it contains a colon, parse as MM:SS
    if (cleaned.includes(":")) {
      const parts = cleaned.split(":");
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }

    // Otherwise parse as seconds
    return parseInt(cleaned) || 0;
  };

  // Helper function to format set timer display
  const formatSetTimerDisplay = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to format timer input value for display
  // If value is 1-2 digits, format as 00:XX (e.g., "30" -> "00:30")
  const formatTimerInputDisplay = (value) => {
    if (!value || value === "") return DEFAULT_SET_TIMER;

    // If it already contains a colon, return as-is
    if (value.includes(":")) {
      return value;
    }

    // If it's 1-2 digits, format as 00:XX
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue.length <= 2 && numericValue.length > 0) {
      const seconds = parseInt(numericValue) || 0;
      return `00:${seconds.toString().padStart(2, "0")}`;
    }

    return value;
  };

  // Handle set timer value changes with auto-formatting to MM:SS
  const handleSetTimerChange = (setId, value) => {
    // Remove all non-numeric characters
    const sanitized = value.replace(/[^0-9]/g, "");

    if (sanitized === "") {
      setSetTimers((prev) => ({
        ...prev,
        [setId]: "",
      }));
      return;
    }

    let formatted;
    if (sanitized.length <= 2) {
      // 1-2 digits: just show the digits as-is (e.g., "3" -> "3", "30" -> "30")
      formatted = sanitized;
    } else {
      // 3+ digits: last 2 digits are seconds, rest are minutes
      // Insert colon naturally: "300" -> "3:00", "3000" -> "30:00"
      const secondsPart = sanitized.slice(-2);
      const minutesPart = sanitized.slice(0, -2);
      const minutes = parseInt(minutesPart) || 0;
      const seconds = parseInt(secondsPart);

      // Cap seconds at 59
      const validSeconds = Math.min(seconds, 59);
      // Cap minutes at 99 for reasonable limits
      const validMinutes = Math.min(minutes, 99);

      // Don't pad minutes with leading zero (e.g., "3:00" not "03:00")
      formatted = `${validMinutes}:${validSeconds.toString().padStart(2, "0")}`;
    }

    setSetTimers((prev) => ({
      ...prev,
      [setId]: formatted,
    }));
  };

  // Set timer countdown effect
  useEffect(() => {
    if (activeSetTimer && timerType === "set") {
      const interval = setInterval(() => {
        setSetTimerRemaining((prev) => {
          const current = prev[activeSetTimer] || 0;
          if (current <= 1) {
            // Timer completed - format the stored timer value if needed
            setSetTimers((prevTimers) => {
              const currentTimerValue = prevTimers[activeSetTimer] || "";
              if (currentTimerValue && !currentTimerValue.includes(":")) {
                // If value is 1-2 digits, format it as 00:XX
                const numericValue = currentTimerValue.replace(/[^0-9]/g, "");
                if (numericValue.length <= 2 && numericValue.length > 0) {
                  const seconds = parseInt(numericValue) || 0;
                  const formatted = `00:${seconds.toString().padStart(2, "0")}`;
                  return {
                    ...prevTimers,
                    [activeSetTimer]: formatted,
                  };
                }
              }
              return prevTimers;
            });

            clearInterval(interval);
            setActiveSetTimer(null);
            hapticSuccess();
            return { ...prev, [activeSetTimer]: 0 };
          }
          return { ...prev, [activeSetTimer]: current - 1 };
        });
      }, 1000);

      timerIntervalRef.current = interval;

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [activeSetTimer, timerType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

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
          };
        }
        return set;
      })
    );
  };

  const handleRepsChange = (id, value) => {
    // Allow only whole numbers, max 3 digits (999)
    const sanitized = value.replace(/[^0-9]/g, "");
    const limited = sanitized.length > 3 ? sanitized.slice(0, 3) : sanitized;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(limited) || 0;
          return {
            ...set,
            reps: limited,
            total: Math.round(weight * reps).toString(),
          };
        }
        return set;
      })
    );
  };

  const handleRirChange = (id, value) => {
    // Allow only whole numbers, max 2 digits (99)
    const sanitized = value.replace(/[^0-9]/g, "");
    const limited = sanitized.length > 2 ? sanitized.slice(0, 2) : sanitized;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          return {
            ...set,
            rir: limited,
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

    // Use previous performance data as defaults if available and setting is enabled
    let defaultWeight = lastSet ? lastSet.weight : "";
    let defaultReps = lastSet ? lastSet.reps : "";

    // Get the corresponding previous set for this new set number
    const newSetIndex = sets.length;
    const correspondingPreviousSet = previousWorkoutSets[newSetIndex];

    if (
      showPreviousPerformance &&
      correspondingPreviousSet &&
      (!lastSet || (!lastSet.weight && !lastSet.reps))
    ) {
      // Use the corresponding previous set data for this set number
      defaultWeight = correspondingPreviousSet.weight.toString();
      defaultReps = correspondingPreviousSet.reps.toString();
    } else if (
      showPreviousPerformance &&
      previousPerformance &&
      (!lastSet || (!lastSet.weight && !lastSet.reps))
    ) {
      // Fallback to best set data if no corresponding previous set
      defaultWeight = weight.roundToHalf(previousPerformance.weight).toString();
      defaultReps = previousPerformance.reps.toString();
    }

    const newSet = {
      id: newSetId,
      weight: defaultWeight,
      reps: defaultReps,
      rir: "",
      total:
        defaultWeight && defaultReps
          ? Math.round(
              parseFloat(defaultWeight) * parseFloat(defaultReps)
            ).toString()
          : "",
      completed: false,
    };
    setSets([...sets, newSet]);

    // Initialize set timer with default value (copy from last set or use default)
    if (timerType === "set") {
      const defaultTimer =
        lastSet && setTimers[lastSet.id]
          ? setTimers[lastSet.id]
          : DEFAULT_SET_TIMER;
      setSetTimers((prev) => ({
        ...prev,
        [newSetId]: defaultTimer,
      }));
    }
  };

  const handleDeleteSet = (setId, rowKey) => {
    hapticMedium();
    // Close all open rows before deleting
    if (swipeListRef.current) {
      swipeListRef.current.closeAllOpenRows();
    }
    setSets((prev) => {
      // Filter out the deleted set
      const filtered = prev.filter((set) => set.id !== setId);
      // Renumber regular sets (skip warmup sets with id "W")
      let setNumber = 1;
      return filtered.map((set) => {
        if (set.id === "W") {
          // Keep warmup sets as-is
          return set;
        } else {
          // Renumber regular sets sequentially
          const newId = setNumber.toString();
          setNumber++;
          return {
            ...set,
            id: newId,
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
          const newSet = { ...set, completed: !set.completed };

          // Use success haptic when completing, light when uncompleting
          if (newSet.completed && !set.completed) {
            hapticSuccess();
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
            } else if (timerType === "set") {
              // Set timer mode - start per-set countdown
              // Stop any existing timer first (only one timer active at a time)
              if (activeSetTimer && timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                setActiveSetTimer(null);
              }

              const timerValue = setTimers[set.id] || "";
              const timerSeconds = parseTimeInput(timerValue);
              if (timerSeconds > 0) {
                setActiveSetTimer(set.id);
                setSetTimerRemaining((prev) => ({
                  ...prev,
                  [set.id]: timerSeconds,
                }));
              }
            }
          } else if (!newSet.completed && set.completed) {
            // If uncompleting a set, stop its timer
            if (timerType === "set" && activeSetTimer === set.id) {
              setActiveSetTimer(null);
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
              }
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

  // Measure collapsible content height
  const handleContentLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      // Always update height if it's different (for remeasurement)
      if (height !== contentHeight) {
        setContentHeight(height);
        setIsContentMeasured(true);
        setNeedsRemeasurement(false);
      }
    }
  };

  // Animated styles for collapsible content
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: animatedOpacity.value,
      overflow: "hidden",
    };
  });

  // Convert sets to the format expected by SwipeListView
  const swipeListData = sets.map((set, index) => ({
    key: `${set.id}-${index}`, // Unique key for SwipeListView
    set: set,
    index: index,
  }));

  // Render the front row (visible content) - only the set row, timer is separate
  const renderItem = ({ item }) => {
    const { set, index } = item;
    const correspondingPreviousSet = previousWorkoutSets[index];

    return (
      <View
        style={[
          styles.setRow,
          index % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
          set.completed && styles.completedSetRow,
        ]}
      >
        <View style={styles.setNumberCell}>
          <Text style={styles.setCell}>{set.id}</Text>
        </View>
        {showPreviousPerformance && (
          <View style={styles.previousCell}>
            <Text
              style={[
                styles.setCell,
                {
                  color: set.completed
                    ? colors.textPrimary
                    : colors.textSecondary,
                  fontSize: FontSize.small,
                },
              ]}
            >
              {correspondingPreviousSet
                ? `${correspondingPreviousSet.weight}${weight.unit} × ${
                    correspondingPreviousSet.reps
                  }${
                    correspondingPreviousSet.rir !== null &&
                    correspondingPreviousSet.rir !== undefined
                      ? ` @ ${correspondingPreviousSet.rir}`
                      : ""
                  }`
                : loadingPrevious
                ? "-"
                : "-"}
            </Text>
          </View>
        )}
        <View style={styles.weightHeaderCell}>
          <TextInput
            ref={(ref) => {
              if (!inputRefs.current[set.id]) inputRefs.current[set.id] = {};
              inputRefs.current[set.id].weight = ref;
            }}
            style={styles.weightInput}
            value={set.weight}
            onChangeText={(value) => handleWeightChange(set.id, value)}
            keyboardType="numeric"
            maxLength={7}
            placeholder={
              showPreviousPerformance && correspondingPreviousSet
                ? correspondingPreviousSet.weight + ""
                : "0"
            }
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus={true}
          />
        </View>
        <View style={styles.repsHeaderCell}>
          <TextInput
            ref={(ref) => {
              if (inputRefs.current[set.id])
                inputRefs.current[set.id].reps = ref;
            }}
            style={styles.repsInput}
            value={set.reps}
            onChangeText={(value) => handleRepsChange(set.id, value)}
            keyboardType="numeric"
            maxLength={3}
            placeholder={
              showPreviousPerformance && correspondingPreviousSet
                ? correspondingPreviousSet.reps.toString()
                : "0"
            }
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus={true}
          />
        </View>
        {showRir && (
          <View style={styles.rirHeaderCell}>
            <TextInput
              ref={(ref) => {
                if (inputRefs.current[set.id])
                  inputRefs.current[set.id].rir = ref;
              }}
              style={styles.rirInput}
              value={set.rir}
              onChangeText={(value) => handleRirChange(set.id, value)}
              keyboardType="numeric"
              maxLength={2}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              selectTextOnFocus={true}
            />
          </View>
        )}
        <View style={styles.completedCell}>
          <TouchableOpacity onPress={() => toggleSetCompletion(index)}>
            <View
              style={[
                styles.checkmarkContainer,
                set.completed && styles.completedCheckmark,
              ]}
            >
              <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the hidden row (delete action)
  const renderHiddenItem = ({ item }) => (
    <View style={styles.hiddenItemContainer}>
      <View style={styles.hiddenItemLeft} />
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteSet(item.set.id, item.key)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        isActive && { opacity: 0.8, transform: [{ scale: 1.02 }] },
      ]}
    >
      {/* Always visible header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exerciseTitleRow}
          onLongPress={drag}
          disabled={!drag}
          activeOpacity={0.8}
        >
          <View style={styles.exerciseIconContainer}>
            {exerciseDetails?.local_media_path && !imageError ? (
              <Image
                source={{
                  uri: `file://${FileSystem.cacheDirectory}app_media/exercises/${exerciseDetails.local_media_path}`,
                }}
                style={styles.exerciseImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name="barbell" size={24} color={colors.textPrimary} />
            )}
          </View>
          <Text style={[styles.exerciseName, isActive && { opacity: 0.5 }]}>
            {exerciseDetails?.name || ""}
          </Text>
        </TouchableOpacity>

        {!isActive && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Ionicons name="trash-outline" size={24} color={colors.accentRed} />
          </TouchableOpacity>
        )}
      </View>

      {/* Collapsible content */}
      <Animated.View style={animatedContentStyle}>
        <View onLayout={handleContentLayout}>
          {showNotes && (
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes here..."
                placeholderTextColor={colors.textFaded}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          )}

          {restTimerEnabled && timerType === "exercise" && (
            <TouchableOpacity
              style={styles.restTimerContainer}
              onPress={() => setShowRestTimer(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={restTime === 0 ? colors.textFaded : colors.primaryBlue}
              />
              <Text
                style={[
                  styles.restTimerText,
                  restTime === 0 && styles.timerOffText,
                ]}
              >
                {`Rest Timer: ${formatTime(restTime)}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Sets List */}
          <View style={styles.setsContainer}>
            {/* Header Row */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setHeaderCell, styles.setNumberCell]}>
                SET
              </Text>
              {showPreviousPerformance && (
                <Text style={[styles.setHeaderCell, styles.previousCell]}>
                  PREVIOUS
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.weightHeaderCell]}>
                {weight.unitLabel()}
              </Text>
              <Text style={[styles.setHeaderCell, styles.repsHeaderCell]}>
                REPS
              </Text>
              {showRir && (
                <Text style={[styles.setHeaderCell, styles.rirHeaderCell]}>
                  RIR
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
            </View>

            {/* Sets List - manually rendered so timer is not swipeable */}
            {sets.map((set, index) => {
              const correspondingPreviousSet = previousWorkoutSets[index];
              const isSetTimerActive = activeSetTimer === set.id;
              const timerRemaining = setTimerRemaining[set.id] || 0;

              return (
                <View key={`set-${set.id}-${index}`}>
                  {/* Swipeable set row using SwipeToDelete */}
                  <SwipeToDelete
                    onDelete={() =>
                      handleDeleteSet(set.id, `${set.id}-${index}`)
                    }
                    style={{}}
                    deleteButtonColor={colors.accentRed}
                  >
                    <View
                      style={[
                        styles.setRow,
                        index % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
                        set.completed && styles.completedSetRow,
                      ]}
                    >
                      <View style={styles.setNumberCell}>
                        <Text style={styles.setCell}>{set.id}</Text>
                      </View>
                      {showPreviousPerformance && (
                        <View style={styles.previousCell}>
                          <Text
                            style={[
                              styles.setCell,
                              {
                                color: set.completed
                                  ? colors.textPrimary
                                  : colors.textSecondary,
                                fontSize: FontSize.small,
                              },
                            ]}
                          >
                            {correspondingPreviousSet
                              ? `${correspondingPreviousSet.weight}${
                                  weight.unit
                                } × ${correspondingPreviousSet.reps}${
                                  correspondingPreviousSet.rir !== null &&
                                  correspondingPreviousSet.rir !== undefined
                                    ? ` @ ${correspondingPreviousSet.rir}`
                                    : ""
                                }`
                              : loadingPrevious
                              ? "-"
                              : "-"}
                          </Text>
                        </View>
                      )}
                      <View style={styles.weightHeaderCell}>
                        <TextInput
                          ref={(ref) => {
                            if (!inputRefs.current[set.id])
                              inputRefs.current[set.id] = {};
                            inputRefs.current[set.id].weight = ref;
                          }}
                          style={styles.weightInput}
                          value={set.weight}
                          onChangeText={(value) =>
                            handleWeightChange(set.id, value)
                          }
                          keyboardType="numeric"
                          maxLength={7}
                          placeholder={
                            showPreviousPerformance && correspondingPreviousSet
                              ? correspondingPreviousSet.weight + ""
                              : "0"
                          }
                          placeholderTextColor={colors.textSecondary}
                          selectTextOnFocus={true}
                        />
                      </View>
                      <View style={styles.repsHeaderCell}>
                        <TextInput
                          ref={(ref) => {
                            if (inputRefs.current[set.id])
                              inputRefs.current[set.id].reps = ref;
                          }}
                          style={styles.repsInput}
                          value={set.reps}
                          onChangeText={(value) =>
                            handleRepsChange(set.id, value)
                          }
                          keyboardType="numeric"
                          maxLength={3}
                          placeholder={
                            showPreviousPerformance && correspondingPreviousSet
                              ? correspondingPreviousSet.reps.toString()
                              : "0"
                          }
                          placeholderTextColor={colors.textSecondary}
                          selectTextOnFocus={true}
                        />
                      </View>
                      {showRir && (
                        <View style={styles.rirHeaderCell}>
                          <TextInput
                            ref={(ref) => {
                              if (inputRefs.current[set.id])
                                inputRefs.current[set.id].rir = ref;
                            }}
                            style={styles.rirInput}
                            value={set.rir}
                            onChangeText={(value) =>
                              handleRirChange(set.id, value)
                            }
                            keyboardType="numeric"
                            maxLength={2}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            selectTextOnFocus={true}
                          />
                        </View>
                      )}
                      <View style={styles.completedCell}>
                        <TouchableOpacity
                          onPress={() => toggleSetCompletion(index)}
                        >
                          <View
                            style={[
                              styles.checkmarkContainer,
                              set.completed && styles.completedCheckmark,
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={colors.textPrimary}
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </SwipeToDelete>

                  {/* Timer below row - not swipeable */}
                  {timerType === "set" && (
                    <>
                      {/* Timer input - always visible when timer is not active */}
                      {!isSetTimerActive && (
                        <View style={styles.setTimerInputContainer}>
                          <View
                            style={[
                              styles.setTimerLine,
                              set.completed
                                ? styles.setTimerLineCompleted
                                : styles.setTimerLineIncomplete,
                            ]}
                          />
                          <TextInput
                            ref={(ref) => {
                              if (inputRefs.current[set.id])
                                inputRefs.current[set.id].timer = ref;
                            }}
                            style={[
                              styles.setTimerInputField,
                              set.completed
                                ? styles.setTimerInputFieldCompleted
                                : styles.setTimerInputFieldIncomplete,
                            ]}
                            value={setTimers[set.id] || DEFAULT_SET_TIMER}
                            onChangeText={(value) =>
                              handleSetTimerChange(set.id, value)
                            }
                            keyboardType="numeric"
                            maxLength={6}
                            placeholder={DEFAULT_SET_TIMER}
                            placeholderTextColor={colors.textSecondary}
                            selectTextOnFocus={true}
                            editable={!set.completed}
                          />
                          <View
                            style={[
                              styles.setTimerLine,
                              set.completed
                                ? styles.setTimerLineCompleted
                                : styles.setTimerLineIncomplete,
                            ]}
                          />
                        </View>
                      )}

                      {/* Progress bar - only show when timer is actively counting down */}
                      {isSetTimerActive && timerRemaining > 0 && (
                        <View style={styles.setTimerProgressContainer}>
                          <Animated.View
                            style={[
                              styles.setTimerProgressBar,
                              {
                                width: `${
                                  (timerRemaining /
                                    parseTimeInput(
                                      setTimers[set.id] || DEFAULT_SET_TIMER
                                    )) *
                                  100
                                }%`,
                              },
                            ]}
                          />
                          <Text style={styles.setTimerCountdown}>
                            {formatSetTimerDisplay(timerRemaining)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {/* Add Set Button */}
          <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <RestTimerModal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        onSelectTime={handleRestTimeSelect}
        currentTime={restTime}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={onRemoveExercise}
        title={`Delete ${exerciseDetails?.name || "Exercise"}?`}
      />
    </View>
  );
};

export default ActiveExerciseComponent;
