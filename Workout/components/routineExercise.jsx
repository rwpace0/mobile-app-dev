import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/activeExercise.styles";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import SwipeToDelete from "../animations/SwipeToDelete";

const RoutineExerciseComponent = ({ exercise, onRemoveExercise }) => {
  const [sets, setSets] = useState([{ id: "1" }]);
  const [notes, setNotes] = useState("");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const newSetId = (parseInt(lastSet.id) + 1).toString();
    setSets([...sets, { id: newSetId }]);
  };

  const handleDeleteSet = (setId) => {
    setSets(prev => prev.filter(set => set.id !== setId));
  };

  const handleRestTimeSelect = (seconds) => {
    setRestTime(seconds);
    setShowRestTimer(false);
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return "Off";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise?.name || "Exercise"}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowDeleteConfirm(true)}>
          <Ionicons name="trash-outline" size={24} color="#FF4444" />
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
        <Text style={[
          styles.restTimerText,
          restTime === 0 && styles.timerOffText
        ]}>
          {`Rest Timer: ${formatTime(restTime)}`}
        </Text>
      </TouchableOpacity>

      {/* Sets List */}
      <View style={styles.setsContainer}>
        {/* Header Row */}
        <View style={styles.setHeaderRow}>
          <Text style={[styles.setHeaderCell, styles.setNumberCell]}>SET</Text>
          <Text style={[styles.setHeaderCell, styles.weightCell]}>REPS</Text>
        </View>

        {/* Set Rows */}
        {sets.map((set) => (
          <SwipeToDelete
            key={set.id}
            onDelete={() => handleDeleteSet(set.id)}
            style={styles.setRow}
          >
            <Text style={[styles.setCell, styles.setNumberCell]}>{set.id}</Text>
            <Text style={[styles.setCell, styles.weightCell]}>-</Text>
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
        title={`Delete ${exercise?.name || 'Exercise'}?`}
      />
    </View>
  );
};

export default RoutineExerciseComponent;