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
import { Spacing } from "../constants/theme";
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
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>
            {exerciseDetails?.name || "Exercise"}
          </Text>
          {exerciseDetails?.muscle_group && (
            <Text style={[styles.exerciseNotes, { marginTop: Spacing.xxs, backgroundColor: 'transparent', padding: 0 }]}>
              {exerciseDetails.muscle_group.charAt(0).toUpperCase() + 
                exerciseDetails.muscle_group.slice(1)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setShowDeleteConfirm(true)}
        >
          <Ionicons name="trash-outline" size={24} color={colors.accentRed} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.exerciseNotes}
        placeholder="Add notes here..."
        placeholderTextColor={colors.textFaded}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

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
          style={[styles.restTimerText, restTime === 0 && styles.timerOffText]}
        >
          {`Rest Timer: ${formatTime(restTime)}`}
        </Text>
      </TouchableOpacity>

      <View style={[styles.setRow, { justifyContent: 'space-between' }]}>
        <Text style={[styles.setCell, { marginLeft: Spacing.xs }]}>Sets:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.checkmarkContainer, { marginRight: Spacing.m }]}
            onPress={() => handleSetChange(numSets - 1)}
          >
            <Ionicons name="remove" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.setCell}>{numSets}</Text>
          <TouchableOpacity
            style={[styles.checkmarkContainer, { marginLeft: Spacing.m }]}
            onPress={() => handleSetChange(numSets + 1)}
          >
            <Ionicons name="add" size={20} color={colors.textPrimary} />
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
