import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createStyles } from "../../styles/workoutPages.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import RoutineExerciseComponent from "../../components/routineExerciseCard";
import templateAPI from "../../API/templateAPI";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import Header from "../../components/static/header";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";

const RoutineCreate = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [totalSets, setTotalSets] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { alertState, showError, hideAlert } = useAlertModal();



  const handleAddExercise = () => {
    navigation.navigate("AddExercise", {
      onExercisesSelected: (selectedExercises) => {
        setExercises((prev) => [...prev, ...selectedExercises]);
      },
    });
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.exercise_id !== exerciseId));
  };

  const handleCancel = () => {
    if (routineName.trim() || exercises.length > 0) {
      setShowCancelConfirm(true);
    } else {
      navigation.goBack();
    }
  };

  const handleUpdateSets = (exerciseId, numSets) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId ? { ...ex, sets: numSets } : ex
      )
    );
  };

  const handleSave = async () => {
    console.log("Save button pressed");

    // Validate routine name
    if (!routineName.trim()) {
      showError("Error", "Please enter a routine name");
      return;
    }

    if (exercises.length === 0) {
      showError("Error", "Please add at least one exercise");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Current exercises:", exercises);

      // Transform exercises to match backend format
      const exercisesPayload = exercises.map((exercise, index) => ({
        exercise_id: exercise.exercise_id,
        exercise_order: index + 1,
        sets: exercise.sets || 1,
      }));

      console.log("Exercises payload:", exercisesPayload);

      const templateData = {
        name: routineName.trim(), // Make sure name is properly set
        is_public: false,
        exercises: exercisesPayload,
      };

      console.log("Sending template data:", templateData);
      const response = await templateAPI.createTemplate(templateData);
      console.log("Template save response:", response);
    } catch (error) {
      console.error("Failed to save template:", error);
      showError(
        "Error",
        error.response?.data?.error ||
          error.message ||
          "Failed to save template. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
    navigation.goBack();
  };

  const handleDiscard = () => {
    setExercises([]);
    setRoutineName("");
    setTotalSets(0);
  };

  // Update total sets when exercises change
  const updateTotals = (exerciseId, sets) => {
    setTotalSets((prev) => prev + sets);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Create Routine"
        leftComponent={{
          type: 'button',
          text: 'Cancel',
          onPress: handleCancel
        }}
        rightComponent={{
          type: 'button',
          text: isSaving ? "Saving..." : "Save",
          onPress: handleSave
        }}
      />

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.routineNameInput}
          placeholder="Routine Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={routineName}
          onChangeText={setRoutineName}
        />

        {exercises.length === 0 ? (
          <View style={styles.emptyWorkoutContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="barbell-outline" size={42} color={colors.textSecondary} />
            </View>
            <Text style={styles.getStartedText}>Get started</Text>
            <Text style={styles.instructionText}>
              Add an exercise to create your routine
            </Text>

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exercisesContainer}>
            {exercises.map((exercise) => (
              <RoutineExerciseComponent
                key={exercise.exercise_id}
                exercise={exercise}
                onUpdateTotals={updateTotals}
                onRemoveExercise={() =>
                  handleRemoveExercise(exercise.exercise_id)
                }
                onUpdateSets={handleUpdateSets}
              />
            ))}

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <DeleteConfirmModal
        visible={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigation.goBack()}
        title="Discard Changes?"
      />

      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </SafeAreaView>
  );
};

export default RoutineCreate;
