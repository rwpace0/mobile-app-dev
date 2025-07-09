import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ActiveExerciseComponent from "../components/activeExerciseCard";
import workoutAPI from "../API/workoutAPI";
import Header from "../components/header";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { createStyles } from "../styles/workoutPages.styles";
import { useWeight } from "../utils/useWeight";

const EditWorkoutPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const { workout_id } = route.params || {};
  
  const [exercises, setExercises] = useState([]);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [exerciseStates, setExerciseStates] = useState({});
  const [workoutName, setWorkoutName] = useState("");
  const [originalWorkout, setOriginalWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workout_id) {
      loadWorkoutData();
    }
  }, [workout_id]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);
      const workout = await workoutAPI.getWorkoutById(workout_id);
      
      if (!workout) {
        Alert.alert("Error", "Workout not found");
        navigation.goBack();
        return;
      }

      setOriginalWorkout(workout);
      setWorkoutName(workout.name);
      setWorkoutDuration(workout.duration || 0);

      // Transform workout exercises to match the format expected by ActiveExerciseComponent
      const transformedExercises = workout.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        name: ex.name,
        muscle_group: ex.muscle_group
      }));

      setExercises(transformedExercises);

      // Set up exercise states with existing sets and notes
      const initialStates = {};
      workout.exercises.forEach(ex => {
        initialStates[ex.exercise_id] = {
          sets: ex.sets.map((set, index) => {
            // Convert weight from storage to user's preferred unit for editing
            const convertedWeight = weight.fromStorage(set.weight);
            // Round to avoid floating point precision issues
            const roundedWeight = Math.round(convertedWeight * 100) / 100;
            return {
              id: (index + 1).toString(),
              weight: roundedWeight.toString(),
              reps: set.reps.toString(),
              total: (roundedWeight * set.reps).toString(),
              completed: true, // Existing sets are considered completed
              rir: set.rir
            };
          }),
          notes: ex.notes || ""
        };
      });

      setExerciseStates(initialStates);

      // Calculate initial totals
      let volume = 0;
      let setsCount = 0;
      workout.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          // Convert weight from storage to user's preferred unit for volume calculation
          const convertedWeight = weight.fromStorage(set.weight);
          // Round to avoid floating point precision issues
          const roundedWeight = Math.round(convertedWeight * 100) / 100;
          volume += roundedWeight * set.reps;
          setsCount++;
        });
      });
      
      setTotalVolume(volume);
      setTotalSets(setsCount);

    } catch (error) {
      console.error("Error loading workout:", error);
      Alert.alert("Error", "Failed to load workout data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };



  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
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
    // Remove from exercise states too
    const newStates = { ...exerciseStates };
    delete newStates[exerciseId];
    setExerciseStates(newStates);
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard all changes? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleExerciseStateChange = (exercise_id, { sets, notes }) => {
    setExerciseStates((prev) => ({
      ...prev,
      [exercise_id]: { sets, notes },
    }));
  };

  const handleSave = async () => {
    try {
      if (!workoutName.trim()) {
        Alert.alert("Error", "Please enter a workout name");
        return;
      }

      // Build exercises array
      const exercisesPayload = exercises.map((exercise, index) => {
        const state = exerciseStates[exercise.exercise_id] || {
          sets: [],
          notes: "",
        };
        
        // Only include sets with weight and reps
        const sets = (state.sets || [])
          .filter((set) => set.weight && set.reps)
          .map((set, idx) => ({
            weight: weight.toStorage(Number(set.weight)),
            reps: Number(set.reps),
            rir: (set.rir !== "" && set.rir != null) ? Number(set.rir) : null,
            set_order: idx + 1,
          }));

        return {
          exercise_id: exercise.exercise_id,
          exercise_order: index + 1,
          notes: state.notes || "",
          sets,
        };
      });

      // Filter out exercises with no sets
      const validExercises = exercisesPayload.filter(ex => ex.sets.length > 0);

      if (validExercises.length === 0) {
        Alert.alert(
          "No Sets Recorded",
          "Please add at least one set with weight and reps before saving the workout."
        );
        return;
      }

      const payload = {
        name: workoutName,
        date_performed: originalWorkout?.date_performed || new Date().toISOString(),
        duration: workoutDuration,
        exercises: validExercises,
      };

      await workoutAPI.updateWorkout(workout_id, payload);
      
      Alert.alert(
        "Success",
        "Workout updated successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error("Failed to update workout:", err);
      Alert.alert(
        "Error",
        "Failed to update workout. Please try again."
      );
    }
  };

  // Update total volume and sets when exercises change
  const updateTotals = (exerciseId, volume, sets) => {
    setTotalVolume((prev) => prev + volume);
    setTotalSets((prev) => prev + sets);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Edit Workout" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Edit Workout"
        leftComponent={{
          type: 'back',
        }}
        rightComponent={{
          type: 'button',
          text: 'Save',
          onPress: handleSave
        }}
      />

      <ScrollView style={styles.content}>
        {/* Workout Name Input */}
        <View style={styles.nameInputContainer}>
          <Text style={styles.nameInputLabel}>Workout Name</Text>
          <TextInput
            style={styles.nameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Enter workout name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(workoutDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{weight.formatVolume(Math.round(totalVolume))}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
        </View>

        {exercises.length === 0 ? (
          <View style={styles.emptyWorkoutContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="barbell-outline" size={42} color={colors.textSecondary} />
            </View>
            <Text style={styles.getStartedText}>No exercises</Text>
            <Text style={styles.instructionText}>
              Add an exercise to continue editing
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
                initialState={exerciseStates[exercise.exercise_id]}
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EditWorkoutPage; 