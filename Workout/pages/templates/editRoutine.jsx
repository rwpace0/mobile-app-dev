import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
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
import exercisesAPI from "../../API/exercisesAPI";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import Header from "../../components/static/header";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";
import { hapticLight, hapticSuccess } from "../../utils/hapticFeedback";

const EditRoutine = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { template_id } = route.params || {};

  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [totalSets, setTotalSets] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState(null);
  const { alertState, showError, showSuccess, hideAlert } = useAlertModal();

  useEffect(() => {
    if (template_id) {
      loadTemplateData();
    }
  }, [template_id]);

  const loadTemplateData = async () => {
    try {
      setLoading(true);
      const template = await templateAPI.getTemplateById(template_id);

      if (!template) {
        showError("Error", "Template not found");
        return;
      }

      setOriginalTemplate(template);
      setRoutineName(template.name || "");

      // Load exercise details for each exercise in template
      if (template.exercises && template.exercises.length > 0) {
        const exercisesWithDetails = await Promise.all(
          template.exercises.map(async (templateExercise) => {
            const exerciseDetails = await exercisesAPI.getExerciseById(
              templateExercise.exercise_id
            );
            return {
              exercise_id: templateExercise.exercise_id,
              name: exerciseDetails?.name || "Unknown Exercise",
              muscle_group: exerciseDetails?.muscle_group || "",
              sets: templateExercise.sets || 1,
              weight:
                templateExercise.weight !== undefined
                  ? templateExercise.weight
                  : null,
              reps:
                templateExercise.reps !== undefined
                  ? templateExercise.reps
                  : null,
              rep_range_min:
                templateExercise.rep_range_min !== undefined
                  ? templateExercise.rep_range_min
                  : null,
              rep_range_max:
                templateExercise.rep_range_max !== undefined
                  ? templateExercise.rep_range_max
                  : null,
              rir:
                templateExercise.rir !== undefined
                  ? templateExercise.rir
                  : null,
              rir_range_min:
                templateExercise.rir_range_min !== undefined
                  ? templateExercise.rir_range_min
                  : null,
              rir_range_max:
                templateExercise.rir_range_max !== undefined
                  ? templateExercise.rir_range_max
                  : null,
            };
          })
        );
        setExercises(exercisesWithDetails);

        // Calculate total sets
        const total = exercisesWithDetails.reduce(
          (sum, ex) => sum + (ex.sets || 1),
          0
        );
        setTotalSets(total);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      showError("Error", "Failed to load routine data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
    // Check if any changes were made
    const hasChanges =
      routineName !== (originalTemplate?.name || "") ||
      exercises.length !== (originalTemplate?.exercises?.length || 0) ||
      JSON.stringify(
        exercises.map((ex) => ({ exercise_id: ex.exercise_id, sets: ex.sets }))
      ) !==
        JSON.stringify(
          (originalTemplate?.exercises || []).map((ex) => ({
            exercise_id: ex.exercise_id,
            sets: ex.sets,
          }))
        );

    if (hasChanges) {
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
      <View style={styles.routineNameInputContainer}>
        <TextInput
          style={styles.routineNameInput}
          placeholder="Routine Name"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={routineName}
          onChangeText={setRoutineName}
        />
        {routineName && routineName.length > 0 && (
          <TouchableOpacity
            style={styles.routineNameClearButton}
            onPress={() => setRoutineName("")}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    ),
    [routineName, styles, colors]
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
        name: routineName.trim(),
        is_public: originalTemplate?.is_public || false,
        exercises: exercisesPayload,
      };

      console.log("Updating template data:", templateData);
      const response = await templateAPI.updateTemplate(
        template_id,
        templateData
      );
      console.log("Template update response:", response);

      showSuccess("Success", "Routine updated successfully", {
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      console.error("Failed to update template:", error);
      showError(
        "Error",
        error.response?.data?.error ||
          error.message ||
          "Failed to update routine. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Edit Routine" leftComponent={{ type: "back" }} />
        <View
          style={[
            styles.content,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Routine"
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
          <View style={styles.routineNameInputContainer}>
            <TextInput
              style={styles.routineNameInput}
              placeholder="Routine Name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={routineName}
              onChangeText={setRoutineName}
            />
            {routineName && routineName.length > 0 && (
              <TouchableOpacity
                style={styles.routineNameClearButton}
                onPress={() => setRoutineName("")}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
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
        message="Are you sure you want to discard your changes?"
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

export default EditRoutine;
