import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import exercisesAPI from "../API/exercisesAPI";
import { createStyles } from "../styles/activeExercise.styles";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";

const RoutineExerciseComponent = ({
  exercise,
  onUpdateSets,
  onRemoveExercise,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
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
    <View style={styles.container}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>
            {exerciseDetails?.name || "Exercise"}
          </Text>
          <Text style={[styles.restTimerText, { marginLeft: 0 }]}>
            {exerciseDetails?.muscle_group 
              ? exerciseDetails.muscle_group.charAt(0).toUpperCase() + 
                exerciseDetails.muscle_group.slice(1)
              : ""}
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
          color={restTime === 0 ? colors.textFaded : "#2196F3"}
        />
        <Text
          style={[styles.restTimerText, restTime === 0 && styles.timerOffText]}
        >
          {`Rest Timer: ${formatTime(restTime)}`}
        </Text>
      </TouchableOpacity>

      <View style={[styles.setRow, { justifyContent: 'space-between' }]}>
        <Text style={[styles.setCell, { marginLeft: 8 }]}>Sets:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.checkmarkContainer, { marginRight: 16 }]}
            onPress={() => handleSetChange(numSets - 1)}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.setCell}>{numSets}</Text>
          <TouchableOpacity
            style={[styles.checkmarkContainer, { marginLeft: 16 }]}
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
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onRemoveExercise(exercise.exercise_id);
        }}
        title={`Delete ${exerciseDetails?.name || "Exercise"}?`}
      />
    </View>
  );
};

export default RoutineExerciseComponent;
