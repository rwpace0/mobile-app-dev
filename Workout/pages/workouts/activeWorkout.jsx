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
import DraggableFlatList from "react-native-draggable-flatlist";
import ActiveExerciseComponent from "../../components/activeExerciseCard";
import workoutAPI from "../../API/workoutAPI";
import Header from "../../components/static/header";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { createStyles } from "../../styles/workoutPages.styles";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import { useActiveWorkout } from "../../state/ActiveWorkoutContext";
import { useWeight } from "../../utils/useWeight";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";
import { hapticLight } from '../../utils/hapticFeedback';

const ActiveWorkoutPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const { activeWorkout, startWorkout, updateWorkout, endWorkout } = useActiveWorkout();
  const { templateId } = route.params || {};
  
  const [exercises, setExercises] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [exerciseStates, setExerciseStates] = useState({});
  const [workoutName, setWorkoutName] = useState("");
  const [exerciseTotals, setExerciseTotals] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { alertState, showError, showWarning, showInfo, showSuccess, hideAlert } = useAlertModal();

  // Initialize state on mount - optimized for faster loading
  useEffect(() => {
    if (activeWorkout) {
      // Restore from existing workout context
      setExercises(activeWorkout.exercises || []);
      setExerciseStates(activeWorkout.exerciseStates || {});
      setWorkoutName(activeWorkout.name || `Workout on ${new Date().toLocaleDateString()}`);
      setTotalVolume(activeWorkout.totalVolume || 0);
      setTotalSets(activeWorkout.totalSets || 0);
      setExerciseTotals(activeWorkout.exerciseTotals || {});
          } else {
        // Handle initial exercises and workout name from template/routine start for new workout
        const initialExercises = route.params?.selectedExercises || [];
        const defaultWorkoutName = `Workout on ${new Date().toLocaleDateString()}`;
        const initialWorkoutName = route.params?.workoutName || defaultWorkoutName;
        
        setExercises(initialExercises);
        setWorkoutName(initialWorkoutName);
        
        // Create new workout in context immediately
        startWorkout({
          name: initialWorkoutName,
          exercises: initialExercises,
          exerciseStates: {},
          duration: 0,
          totalVolume: 0,
          totalSets: 0,
          exerciseTotals: {},
        });

        // Clear the params to prevent re-processing
        if (route.params?.selectedExercises || route.params?.workoutName) {
          navigation.setParams({ selectedExercises: undefined, workoutName: undefined });
        }
      }
  }, []); // Only run on mount

  // Update workout in context when state changes - debounced for performance
  useEffect(() => {
    if (activeWorkout) {
      // Only update if there's actual data to save
      if (exercises.length > 0 || Object.keys(exerciseStates).length > 0) {
        const workoutUpdate = {
          name: workoutName || `Workout on ${new Date().toLocaleDateString()}`,
          exercises: exercises,
          exerciseStates: exerciseStates,
          totalVolume: totalVolume,
          totalSets: totalSets,
          exerciseTotals: exerciseTotals,
          // Don't override duration - let the timer handle it
        };
        updateWorkout(workoutUpdate);
      }
    }
  }, [workoutName, exercises, exerciseStates, totalVolume, totalSets, exerciseTotals]);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const handleAddExercise = () => {
    hapticLight();
    navigation.navigate("AddExercise", {
      onExercisesSelected: (selectedExercises) => {
        setExercises((prev) => {
          const newExercises = [...prev, ...selectedExercises];
          return newExercises;
        });
      },
    });
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.exercise_id !== exerciseId));
    setExerciseTotals((prev) => {
      const newTotals = { ...prev };
      delete newTotals[exerciseId];
      return newTotals;
    });
    setExerciseStates((prev) => {
      const newStates = { ...prev };
      delete newStates[exerciseId];
      return newStates;
    });
  };

  const handleDragEnd = ({ data }) => {
    hapticLight();
    setExercises(data);
  };

  const renderExerciseItem = ({ item: exercise, drag, isActive }) => {
    return (
      <ActiveExerciseComponent
        key={exercise.exercise_id}
        exercise={exercise}
        initialState={exerciseStates[exercise.exercise_id]}
        onUpdateTotals={updateTotals}
        onRemoveExercise={() => handleRemoveExercise(exercise.exercise_id)}
        onStateChange={(state) => handleExerciseStateChange(exercise.exercise_id, state)}
        drag={drag}
        isActive={isActive}
      />
    );
  };

  const handleDiscard = () => {
    if (showDeleteConfirm) {
      // End workout in context
      endWorkout();
      navigation.goBack();
    } else {
      setShowDeleteConfirm(true);
    }
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
      const finalWorkoutName = workoutName || `Workout on ${now.toLocaleDateString()}`;
      const datePerformed = now.toISOString();
      
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
            rir: set.rir ? Number(set.rir) : null,
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
        showWarning(
          "No Sets Recorded",
          "Add an exercise"
        );
        return;
      }

      const payload = {
        name: finalWorkoutName,
        date_performed: datePerformed,
        duration: activeWorkout?.duration || 0,
        exercises: validExercises,
        templateId: templateId,
      };

      await workoutAPI.finishWorkout(payload);
      console.log("Workout saved successfully!");
      
      // End workout in context
      endWorkout();
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save workout:", err);
      showError(
        "Error",
        "Failed to save workout. Please try again."
      );
    }
  };

  const updateTotals = (exerciseId, volume, sets) => {
    setExerciseTotals((prev) => ({
      ...prev,
      [exerciseId]: { volume, sets }
    }));
  };

  useEffect(() => {
    const totals = Object.values(exerciseTotals);
    const newTotalVolume = totals.reduce((sum, exercise) => sum + exercise.volume, 0);
    const newTotalSets = totals.reduce((sum, exercise) => sum + exercise.sets, 0);
    
    setTotalVolume(newTotalVolume);
    setTotalSets(newTotalSets);
  }, [exerciseTotals]);

  const handleSettings = (type) => {
    navigation.navigate("WorkoutSettings", { type: "workouts" });
  };

  const handleMinimizeWorkout = () => {
    // Close the screen, but keep the workout active in context
    navigation.goBack();
  };

  // Example functions showing different alert types
  const handleShowInfo = () => {
    showInfo(
      "Workout Tips",
      "Remember to maintain proper form and take adequate rest between sets for optimal results."
    );
  };

  const handleShowSuccess = () => {
    showSuccess(
      "Great Job!",
      "You've completed 5 sets. Keep up the momentum!"
    );
  };

  const handleShowWarningWithConfirm = () => {
    showWarning(
      "Unsaved Changes",
      "You have unsaved changes. Are you sure you want to leave?",
      {
        showCancel: true,
        confirmText: "Leave",
        cancelText: "Stay",
        onConfirm: () => {
          console.log("User chose to leave");
          navigation.goBack();
        },
        onCancel: () => {
          console.log("User chose to stay");
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Log Workout"
        leftComponent={{
          type: 'down',
          onPress: handleMinimizeWorkout,
        }}
        rightComponent={{
          type: 'button',
          text: 'Finish',
          onPress: handleFinish
        }}
      />

      <View style={styles.content}>
        {exercises.length === 0 ? (
          <ScrollView style={styles.content}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatDuration(activeWorkout?.duration || 0)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{weight.formatVolume(totalVolume)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>{totalSets}</Text>
              </View>
            </View>

            <View style={styles.emptyWorkoutContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="barbell-outline" size={42} color={colors.textSecondary} />
              </View>
              <Text style={styles.getStartedText}>Get started</Text>
              <Text style={styles.instructionText}>
                Add an exercise to start your workout
              </Text>

              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={handleAddExercise}
              >
                <Ionicons name="add" size={20} color={colors.textWhite}/>
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
                  <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
                  <Text style={styles.settingsText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
                  <Ionicons name="trash-outline" size={20} color={colors.accentRed} />
                  <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <DraggableFlatList
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.exercise_id.toString()}
            onDragEnd={handleDragEnd}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesContainer}
            ListHeaderComponent={() => (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {formatDuration(activeWorkout?.duration || 0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Volume</Text>
                  <Text style={styles.statValue}>{weight.formatVolume(totalVolume)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sets</Text>
                  <Text style={styles.statValue}>{totalSets}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={() => (
              <View>
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Ionicons name="add" size={20} color={colors.textWhite} />
                  <Text style={styles.addExerciseText}>Add Exercise</Text>
                </TouchableOpacity>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
                    <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
                    <Text style={styles.settingsText}>Workout Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
                    <Ionicons name="trash-outline" size={20} color={colors.accentRed} />
                    <Text style={styles.discardText}>Discard Workout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDiscard}
        title="Discard Workout?"
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

export default ActiveWorkoutPage;
