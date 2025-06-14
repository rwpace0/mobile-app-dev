import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import exercisesAPI from "../API/exercisesAPI";
import styles from "../styles/workoutPages.styles";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import SwipeToDelete from "../animations/SwipeToDelete";

const RoutineExerciseComponent = ({
  exercise,
  onUpdateSets,
  onRemoveExercise,
}) => {
  const [numSets, setNumSets] = useState(exercise.sets || 1);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [notes, setNotes] = useState("");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSetChange = (value) => {
    const sets = Math.max(1, Math.min(10, value));
    setNumSets(sets);
    onUpdateSets(exercise.exercise_id, sets);
  };

  const handleRestTimeSelect = (seconds) => {
    setRestTime(seconds);
    setShowRestTimer(false);
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return "Off";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>
            {exerciseDetails?.name || "Exercise"}
          </Text>
          <Text style={styles.exerciseDetail}>
            {exerciseDetails?.muscle_group || ""}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemoveExercise(exercise.exercise_id)}
        >
          <Ionicons name="close" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.notesInput}
        placeholder="Add routine notes here"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
          color={restTime === 0 ? "#999999" : "#2196F3"}
        />
        <Text
          style={[styles.restTimerText, restTime === 0 && styles.timerOffText]}
        >
          {`Rest Timer: ${formatTime(restTime)}`}
        </Text>
      </TouchableOpacity>

      <View style={styles.setsContainer}>
        <Text style={styles.setsLabel}>Sets:</Text>
        <View style={styles.setsControls}>
          <TouchableOpacity
            style={styles.setButton}
            onPress={() => handleSetChange(numSets - 1)}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.setsCount}>{numSets}</Text>
          <TouchableOpacity
            style={styles.setButton}
            onPress={() => handleSetChange(numSets + 1)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

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

export default RoutineExerciseComponent;
