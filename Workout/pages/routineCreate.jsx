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
import styles from "../styles/workoutActive.styles";
import RoutineExerciseComponent from "../components/routineExercise";

const RoutineCreate = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [routineName, setRoutineName] = useState("");
  const [exercises, setExercises] = useState([]);
  const [totalSets, setTotalSets] = useState(0);

  useEffect(() => {
    // Handle receiving new exercises from DisplayPage
    if (route.params?.selectedExercises) {
      setExercises(prev => [...prev, ...route.params.selectedExercises]);
      // Clear the params to prevent re-adding on re-render
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [route.params?.selectedExercises]);

  const handleAddExercise = () => {
    navigation.navigate('Display');
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      // Show error that routine name is required
      return;
    }
    // TODO: Save routine
    navigation.goBack();
  };

  const handleDiscard = () => {
    setExercises([]);
    setRoutineName("");
    setTotalSets(0);
  };

  // Update total sets when exercises change
  const updateTotals = (exerciseId, sets) => {
    setTotalSets(prev => prev + sets);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerButton, styles.cancelButton]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, styles.saveButton]}>Save</Text>
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

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
        </View>

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
                key={exercise.id}
                exercise={exercise}
                onUpdateTotals={updateTotals}
                onRemoveExercise={() => handleRemoveExercise(exercise.id)}
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard Routine</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RoutineCreate;