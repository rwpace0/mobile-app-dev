import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import styles from "../styles/active.styles";
import RoutineExerciseComponent from "../components/routineExercise";
import { templateAPI } from "../API/createTemplate";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

const RoutineCreate = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [totalSets, setTotalSets] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    // Handle receiving new exercises from DisplayPage
    if (route.params?.selectedExercises) {
      setExercises((prev) => [...prev, ...route.params.selectedExercises]);
      // Clear the params to prevent re-adding on re-render
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [route.params?.selectedExercises]);

  const handleAddExercise = () => {
    navigation.navigate("AddExercise", {
      returnTo: "RoutineCreate",
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
      Alert.alert("Error", "Please enter a routine name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
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

      Alert.alert("Success", "Template saved successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Failed to save template:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error ||
          error.message ||
          "Failed to save template. Please try again."
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerButton, styles.cancelButton]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <TouchableOpacity
          onPress={() => {
            console.log("Save button pressed - immediate log");
            Alert.alert("Debug", "Save button pressed");
            handleSave();
          }}
          disabled={isSaving}
        >
          <Text style={[styles.headerButton, styles.saveButton]}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

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
              <Ionicons name="barbell-outline" size={42} color="#BBBBBB" />
            </View>
            <Text style={styles.getStartedText}>Get started</Text>
            <Text style={styles.instructionText}>
              Add an exercise to create your routine
            </Text>

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
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
              <Ionicons name="add" size={20} color="#FFFFFF" />
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
    </SafeAreaView>
  );
};

export default RoutineCreate;
