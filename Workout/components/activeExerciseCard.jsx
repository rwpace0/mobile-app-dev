import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";
import { getColors } from "../constants/colors";
import { FontSize } from "../constants/theme";
import { createStyles } from "../styles/activeExercise.styles";
import { useTheme, useSettings } from "../state/SettingsContext";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import exercisesAPI from "../API/exercisesAPI";
import { useWeight } from "../utils/useWeight";
import { hapticLight } from "../utils/hapticFeedback";

const ActiveExerciseComponent = ({
  exercise,
  onUpdateTotals,
  onRemoveExercise,
  onStateChange,
  initialState,
}) => {
  const [sets, setSets] = useState(initialState?.sets || exercise.sets || []);
  const [notes, setNotes] = useState(initialState?.notes || "");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [previousPerformance, setPreviousPerformance] = useState(null);
  const [previousWorkoutSets, setPreviousWorkoutSets] = useState([]); // Store all sets from previous workout
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [hasPrefilledData, setHasPrefilledData] = useState(
    !!initialState?.sets
  );
  const { isDark } = useTheme();
  const { showPreviousPerformance } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();

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
  }, [sets]);

  useEffect(() => {
    let interval;
    if (isTimerActive && remainingTime > 0 && restTime !== 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, remainingTime, restTime]);

  // Call onStateChange whenever sets or notes change
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ sets, notes });
    }
  }, [sets, notes]);

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

  const handleAddSet = () => {
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
    setSets((prev) => prev.filter((set) => set.id !== setId));
  };

  const toggleSetCompletion = (index) => {
    hapticLight();
    setSets((prev) =>
      prev.map((set, idx) => {
        if (idx === index) {
          const newSet = { ...set, completed: !set.completed };
          // Start rest timer if set was completed and timer is not off
          if (newSet.completed && !set.completed && restTime !== 0) {
            setRemainingTime(restTime);
            setIsTimerActive(true);
          }
          return newSet;
        }
        return set;
      })
    );
  };

  const handleRestTimeSelect = (seconds) => {
    setRestTime(seconds);
    setIsTimerActive(false);
    setRemainingTime(0);
  };

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
        {!showPreviousPerformance && (
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exerciseDetails?.name || ""}</Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Ionicons name="trash-outline" size={24} color={colors.accentRed} />
        </TouchableOpacity>
      </View>

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
          color={
            restTime === 0
              ? colors.textFaded
              : isTimerActive
              ? colors.accentGreen
              : colors.primaryBlue
          }
        />
        <Text
          style={[
            styles.restTimerText,
            restTime === 0 && styles.timerOffText,
            isTimerActive && styles.activeTimerText,
          ]}
        >
          {isTimerActive
            ? `Rest Timer: ${formatTime(remainingTime)}`
            : `Rest Timer: ${formatTime(restTime)}`}
        </Text>
      </TouchableOpacity>

      {/* Sets List */}
      <View style={styles.setsContainer}>
        {/* Header Row */}
        <View style={styles.setHeaderRow}>
          <Text style={[styles.setHeaderCell, styles.setNumberCell]}>SET</Text>
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
          {!showPreviousPerformance && (
            <Text style={[styles.setHeaderCell, styles.totalCell]}>TOTAL</Text>
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
