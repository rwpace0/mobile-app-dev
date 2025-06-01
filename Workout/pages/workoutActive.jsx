import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import styles from "../styles/active.styles";
import ActiveExerciseComponent from "../components/activeExercise";
import { finishWorkout } from "../API/finishWorkout";

const WorkoutActivePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [exercises, setExercises] = useState([]);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [timer, setTimer] = useState(null);
  const [exerciseStates, setExerciseStates] = useState({});

  useEffect(() => {
    // Handle receiving new exercises from DisplayPage
    if (route.params?.selectedExercises) {
      setExercises((prev) => [...prev, ...route.params.selectedExercises]);
      // Clear the params to prevent re-adding on re-render
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [route.params?.selectedExercises]);

  // Start timer when page loads
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration((prev) => prev + 1);
    }, 1000);
    setTimer(interval);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const handleAddExercise = () => {
    navigation.navigate("AddExercise", {
      returnTo: "WorkoutActive",
    });
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.exercise_id !== exerciseId));
  };

  const handleDiscard = () => {
    // Reset workout state
    setExercises([]);
    setTotalVolume(0);
    setTotalSets(0);
    setWorkoutDuration(0);
  };

  const handleExerciseStateChange = (exercise_id, { sets, notes }) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exercise_id]: { sets, notes },
    }));
  };

  const handleFinish = async () => {
    try {
      // Build workout name and date
      const now = new Date();
      const workoutName = `Workout on ${now.toLocaleDateString()}`;
      const datePerformed = now.toISOString();
      // Build exercises array
      const exercisesPayload = exercises.map((exercise) => {
        const state = exerciseStates[exercise.exercise_id] || {
          sets: [],
          notes: "",
        };
        // Only include sets with weight and reps
        const sets = (state.sets || [])
          .filter((set) => set.weight && set.reps)
          .map((set, idx) => ({
            weight: Number(set.weight),
            reps: Number(set.reps),
            set_order: idx + 1,
          }));
        return {
          exercise_id: exercise.exercise_id,
          notes: state.notes || "",
          sets,
        };
      });
      const payload = {
        name: workoutName,
        date_performed: datePerformed,
        duration: workoutDuration,
        exercises: exercisesPayload,
      };
      console.log(payload);
      await finishWorkout.finishWorkout(payload);
      console.log("Workout saved successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save workout:", err);
    }
  };

  // Update total volume and sets when exercises change
  const updateTotals = (exerciseId, volume, sets) => {
    setTotalVolume((prev) => prev + volume);
    setTotalSets((prev) => prev + sets);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={styles.finishButton}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(workoutDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{totalVolume} kg</Text>
          </View>
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
              Add an exercise to start your workout
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
              <ActiveExerciseComponent
                key={exercise.exercise_id}
                exercise={exercise}
                onUpdateTotals={updateTotals}
                onRemoveExercise={() =>
                  handleRemoveExercise(exercise.exercise_id)
                }
                onStateChange={(state) =>
                  handleExerciseStateChange(exercise.exercise_id, state)
                }
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
          <Text style={styles.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WorkoutActivePage;
