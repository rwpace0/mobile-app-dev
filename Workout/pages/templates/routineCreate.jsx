import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { createStyles } from "../../styles/workoutPages.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import RoutineExerciseComponent from "../../components/routineExerciseCard";
import templateAPI from "../../API/templateAPI";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import Header from "../../components/static/header";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";
import { hapticLight, hapticSuccess } from "../../utils/hapticFeedback";

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

  const handleUpdateValues = (exerciseId, values) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId ? { ...ex, ...values } : ex
      )
    );
  };

  const handleDragEnd = ({ data }) => {
    hapticLight();
    setExercises(data);
  };

  const renderExerciseItem = ({ item: exercise, drag, isActive }) => {
    return (
      <RoutineExerciseComponent
        key={exercise.exercise_id}
        exercise={exercise}
        onUpdateTotals={updateTotals}
        onRemoveExercise={() => handleRemoveExercise(exercise.exercise_id)}
        onUpdateSets={handleUpdateSets}
        onUpdateValues={handleUpdateValues}
        drag={drag}
        isActive={isActive}
      />
    );
  };

  const RoutineNameHeader = useMemo(
    () => (
      <TextInput
        style={styles.routineNameInput}
        placeholder="Routine Name"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={routineName}
        onChangeText={setRoutineName}
      />
    ),
    [routineName]
  );

  const handleSave = async () => {
    console.log("Save button pressed");
    hapticSuccess();

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
        weight: exercise.weight !== undefined ? exercise.weight : null,
        reps: exercise.reps !== undefined ? exercise.reps : null,
        rep_range_min:
          exercise.rep_range_min !== undefined ? exercise.rep_range_min : null,
        rep_range_max:
          exercise.rep_range_max !== undefined ? exercise.rep_range_max : null,
        rir: exercise.rir !== undefined ? exercise.rir : null,
        rir_range_min:
          exercise.rir_range_min !== undefined ? exercise.rir_range_min : null,
        rir_range_max:
          exercise.rir_range_max !== undefined ? exercise.rir_range_max : null,
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
          type: "button",
          text: "Cancel",
          onPress: handleCancel,
        }}
        rightComponent={{
          type: "button",
          text: isSaving ? "Saving..." : "Save",
          onPress: handleSave,
        }}
      />

      {exercises.length === 0 ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 300 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          <TextInput
            style={styles.routineNameInput}
            placeholder="Routine Name"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={routineName}
            onChangeText={setRoutineName}
          />
          <View style={styles.emptyWorkoutContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="barbell-outline"
                size={42}
                color={colors.textSecondary}
              />
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
        </ScrollView>
      ) : (
        <DraggableFlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.exercise_id.toString()}
          onDragEnd={handleDragEnd}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 300 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          ListHeaderComponent={RoutineNameHeader}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          )}
        />
      )}

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
