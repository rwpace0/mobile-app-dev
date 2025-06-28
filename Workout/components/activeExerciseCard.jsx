import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../constants/colors";
import { createStyles } from "../styles/activeExercise.styles";
import { useTheme, useSettings } from "../state/SettingsContext";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import SwipeToDelete from "../animations/SwipeToDelete";
import exercisesAPI from "../API/exercisesAPI";

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
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const { isDark } = useTheme();
  const { showPreviousPerformance } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        const details = await exercisesAPI.getExerciseById(exercise.exercise_id);
        setExerciseDetails(details);
      } catch (error) {
        console.error("Failed to fetch exercise details:", error);
      }
    };

    fetchExerciseDetails();
  }, [exercise.exercise_id]);

  // Fetch previous performance when setting is enabled
  useEffect(() => {
    const fetchPreviousPerformance = async () => {
      if (!showPreviousPerformance || !exercise.exercise_id) return;
      
      try {
        setLoadingPrevious(true);
        const history = await exercisesAPI.getExerciseHistory(exercise.exercise_id);
        
        if (history && history.length > 0) {
          const lastWorkout = history[0]; // Most recent workout
          if (lastWorkout.sets && lastWorkout.sets.length > 0) {
            // Find the best set (highest total weight moved)
            const bestSet = lastWorkout.sets.reduce((best, set) => {
              const currentTotal = (set.weight || 0) * (set.reps || 0);
              const bestTotal = (best.weight || 0) * (best.reps || 0);
              return currentTotal > bestTotal ? set : best;
            });
            
            setPreviousPerformance({
              weight: bestSet.weight,
              reps: bestSet.reps,
              total: (bestSet.weight || 0) * (bestSet.reps || 0),
              date: lastWorkout.date_performed || lastWorkout.created_at,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch previous performance:", error);
      } finally {
        setLoadingPrevious(false);
      }
    };

    fetchPreviousPerformance();
  }, [showPreviousPerformance, exercise.exercise_id]);

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

    const newSet = {
      id: newSetId,
      weight: lastSet ? lastSet.weight : "",
      reps: lastSet ? lastSet.reps : "",
      total: lastSet ? lastSet.total : "",
      completed: false,
    };
    setSets([...sets, newSet]);
  };

  const handleDeleteSet = (setId) => {
    setSets((prev) => prev.filter((set) => set.id !== setId));
  };

  const toggleSetCompletion = (index) => {
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

  return (
    <View style={styles.container}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>
            {exerciseDetails?.name || "Exercise"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
          <Ionicons name="trash-outline" size={24} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.notesInput}
        textPlaceholder="Add notes here..."
        textPlaceholderTextColor="rgba(255, 255, 255, 0.5)"
        value={notes}
        onChangeText={setNotes}
      />

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
              ? "#4CAF50"
              : "#2196F3"
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
          <Text style={[styles.setHeaderCell, styles.setNumberCell]}>#</Text>
          <Text style={[styles.setHeaderCell, styles.weightCell]}>KG</Text>
          <Text style={[styles.setHeaderCell, styles.totalCell]}>
            {showPreviousPerformance ? "PREVIOUS" : "TOTAL"}
          </Text>
          <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
        </View>

        {/* Set Rows */}
        {sets.map((set, index) => (
          <SwipeToDelete
            key={set.id}
            onDelete={() => handleDeleteSet(set.id)}
            style={[
              styles.setRow,
              set.completed &&
                (set.id === "W" ? styles.warmupSetRow : styles.completedSetRow),
            ]}
          >
            <Text style={[styles.setCell, styles.setNumberCell]}>{set.id}</Text>
            <View style={styles.weightCell}>
              <TextInput
                style={[styles.setCell, styles.weightInput]}
                value={set.weight}
                onChangeText={(value) => handleWeightChange(set.id, value)}
                keyboardType="numeric"
                textPlaceholder="0"
                textPlaceholderTextColor="rgba(255, 255, 255, 0.5)"
                selectTextOnFocus={true}
              />
              <Text style={styles.setCell}> × </Text>
              <TextInput
                style={[styles.setCell, styles.repsInput]}
                value={set.reps}
                onChangeText={(value) => handleRepsChange(set.id, value)}
                keyboardType="numeric"
                textPlaceholder="0"
                textPlaceholderTextColor="rgba(255, 255, 255, 0.5)"
                selectTextOnFocus={true}
              />
            </View>
            <Text style={[styles.setCell, styles.totalCell]}>
              {showPreviousPerformance ? (
                previousPerformance ? (
                  `${previousPerformance.weight}kg × ${previousPerformance.reps}`
                ) : loadingPrevious ? (
                  "Loading..."
                ) : (
                  "No data"
                )
              ) : (
                set.total
              )}
            </Text>
            <TouchableOpacity
              style={styles.completedCell}
              onPress={() => toggleSetCompletion(index)}
            >
              <View
                style={[
                  styles.checkmarkContainer,
                  set.completed && styles.completedCheckmark,
                ]}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </SwipeToDelete>
        ))}
      </View>

      {/* Add Set Button */}
      <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
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
