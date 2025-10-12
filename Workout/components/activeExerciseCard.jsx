import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";
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
  const { showPreviousPerformance, showRir } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const inputRefs = useRef({});

  // Update state when initialState prop changes (for restored workouts)
  useEffect(() => {
    if (initialState?.sets) {
      setSets(initialState.sets);
      setHasPrefilledData(true);
    }
    if (initialState?.notes) {
      setNotes(initialState.notes);
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

  // Call onStateChange whenever sets or notes change
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ sets, notes });
    }
  }, [sets, notes]);

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

  const handleWeightChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(value) || 0;
          const reps = parseFloat(set.reps) || 0;
          return {
            ...set,
            weight: value,
            total: Math.round(weight * reps).toString(),
          };
        }
        return set;
      })
    );
  };

  const handleRepsChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(value) || 0;
          return {
            ...set,
            reps: value,
            total: Math.round(weight * reps).toString(),
          };
        }
        return set;
      })
    );
  };

  const handleRirChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          return {
            ...set,
            rir: value,
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
  };

  const handleDeleteSet = (setId) => {
    hapticMedium();
    setSets((prev) => prev.filter((set) => set.id !== setId));
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

          // Start rest timer if set was completed and timer is not off
          if (newSet.completed && !set.completed && onTimerStart) {
            onTimerStart(restTime);
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

  // Render the front row (visible content)
  const renderItem = ({ item }) => {
    const { set, index } = item;
    const correspondingPreviousSet = previousWorkoutSets[index];

    return (
      <View style={[styles.setRow, set.completed && styles.completedSetRow]}>
        <View style={styles.setNumberCell}>
          <Text style={styles.setCell}>{set.id}</Text>
        </View>
        {showPreviousPerformance && (
          <View style={styles.previousCell}>
            <Text
              style={[
                styles.setCell,
                { color: colors.textSecondary, fontSize: FontSize.small },
              ]}
            >
              {correspondingPreviousSet
                ? `${correspondingPreviousSet.weight}${weight.unit} × ${correspondingPreviousSet.reps}`
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
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              selectTextOnFocus={true}
            />
          </View>
        )}
        {!showPreviousPerformance && !showRir && (
          <View style={styles.totalCell}>
            <Text style={styles.setCell}>{set.total}</Text>
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
        onPress={() => handleDeleteSet(item.set.id)}
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
          style={{ flex: 1 }}
          onLongPress={drag}
          disabled={!drag}
          activeOpacity={0.8}
        >
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
              {!showPreviousPerformance && !showRir && (
                <Text style={[styles.setHeaderCell, styles.totalCell]}>
                  TOTAL
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
            </View>

            {/* Swipe List for Sets */}
            <SwipeListView
              data={swipeListData}
              renderItem={renderItem}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              disableRightSwipe={true}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              closeOnRowBeginSwipe={false}
              closeOnScroll={false}
              closeOnRowPress={false}
              closeOnRowOpen={false}
            />
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
