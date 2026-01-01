import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Keyboard,
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
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from "../../utils/hapticFeedback";
import ActiveRestTimer from "../../components/ActiveRestTimer";
import FinishWorkoutModal from "../../components/modals/FinishWorkoutModal";
import templateAPI from "../../API/templateAPI";

const ActiveWorkoutPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const { activeWorkout, startWorkout, updateWorkout, endWorkout } =
    useActiveWorkout();
  const { templateId } = route.params || {};

  const [exercises, setExercises] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [exerciseStates, setExerciseStates] = useState({});
  const [workoutName, setWorkoutName] = useState("");
  const [exerciseTotals, setExerciseTotals] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishModalMode, setFinishModalMode] = useState(null);
  const [routineChanges, setRoutineChanges] = useState({
    addedExercises: 0,
    removedExercises: 0,
    addedSets: 0,
    removedSets: 0,
  });
  const [processedExerciseStates, setProcessedExerciseStates] = useState(null);
  const {
    alertState,
    showError,
    showWarning,
    showInfo,
    showSuccess,
    hideAlert,
  } = useAlertModal();

  // Global rest timer state
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [totalTimerTime, setTotalTimerTime] = useState(0);

  // Initialize state on mount - optimized for faster loading
  useEffect(() => {
    if (activeWorkout) {
      // Restore from existing workout context
      setExercises(activeWorkout.exercises || []);
      setExerciseStates(activeWorkout.exerciseStates || {});
      setWorkoutName(
        activeWorkout.name || `Workout on ${new Date().toLocaleDateString()}`
      );
      setTotalVolume(activeWorkout.totalVolume || 0);
      setTotalSets(activeWorkout.totalSets || 0);
      setExerciseTotals(activeWorkout.exerciseTotals || {});
      // Use templateId from context if available, otherwise from route params
      if (activeWorkout.templateId && !templateId) {
        navigation.setParams({ templateId: activeWorkout.templateId });
      }
    } else {
      // Handle initial exercises and workout name from template/routine start for new workout
      const initialExercises = route.params?.selectedExercises || [];
      const defaultWorkoutName = `Workout on ${new Date().toLocaleDateString()}`;
      const initialWorkoutName =
        route.params?.workoutName || defaultWorkoutName;

      setExercises(initialExercises);
      setWorkoutName(initialWorkoutName);

      // Create new workout in context immediately
      const startNewWorkout = async () => {
        try {
          await startWorkout({
            name: initialWorkoutName,
            exercises: initialExercises,
            exerciseStates: {},
            duration: 0,
            totalVolume: 0,
            totalSets: 0,
            exerciseTotals: {},
            templateId: templateId, // Store templateId in context for persistence
          });
        } catch (error) {
          console.error("Failed to start new workout:", error);
        }
      };

      startNewWorkout();

      // Clear the params to prevent re-processing, but preserve templateId
      if (route.params?.selectedExercises || route.params?.workoutName) {
        navigation.setParams({
          selectedExercises: undefined,
          workoutName: undefined,
          templateId: templateId, // Preserve templateId
        });
      }
    }
  }, []); // Only run on mount

  // Load original template if workout is from a routine
  useEffect(() => {
    const loadOriginalTemplate = async () => {
      // Get templateId from route params or activeWorkout context
      const currentTemplateId =
        templateId || activeWorkout?.templateId;
      if (currentTemplateId) {
        try {
          const template = await templateAPI.getTemplateById(currentTemplateId);
          if (template) {
            setOriginalTemplate(template);
          }
        } catch (error) {
          console.error("Failed to load original template:", error);
        }
      }
    };

    loadOriginalTemplate();
  }, [templateId, activeWorkout?.templateId]);

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
  }, [
    workoutName,
    exercises,
    exerciseStates,
    totalVolume,
    totalSets,
    exerciseTotals,
  ]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
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
    hapticMedium();
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
        onStateChange={(state) =>
          handleExerciseStateChange(exercise.exercise_id, state)
        }
        onTimerStart={handleTimerStart}
        drag={drag}
        isActive={isActive}
      />
    );
  };

  const handleDiscard = async () => {
    hapticWarning();
    if (showDeleteConfirm) {
      try {
        // End workout in context
        await endWorkout();
        navigation.goBack();
      } catch (error) {
        console.error("Failed to discard workout:", error);
        // Navigate back even if endWorkout fails
        navigation.goBack();
      }
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

  // Helper function to check for routine changes and show modal if needed
  const checkAndShowRoutineUpdateModal = (statesToUse = null) => {
    const currentTemplateId = templateId || activeWorkout?.templateId;
    if (!currentTemplateId || !originalTemplate) {
      return false;
    }

    // Use provided states or current states
    const statesForComparison = statesToUse || exerciseStates;

    // Compare current workout with original template
    const templateExerciseIds = new Set(
      (originalTemplate.exercises || []).map((ex) => ex.exercise_id)
    );
    const currentExerciseIds = new Set(
      exercises.map((ex) => ex.exercise_id)
    );

    // Count added exercises (exercises in workout not in template)
    const addedExercises = exercises.filter(
      (ex) => !templateExerciseIds.has(ex.exercise_id)
    );
    const addedExercisesCount = addedExercises.length;

    // Count removed exercises (exercises in template not in workout)
    const removedExercises = (originalTemplate.exercises || []).filter(
      (te) => !currentExerciseIds.has(te.exercise_id)
    );
    const removedExercisesCount = removedExercises.length;

    // Count set changes
    let addedSetsCount = 0;
    let removedSetsCount = 0;

    // For exercises that exist in both template and workout
    exercises.forEach((ex) => {
      const templateExercise = (originalTemplate.exercises || []).find(
        (te) => te.exercise_id === ex.exercise_id
      );
      if (templateExercise) {
        const state = statesForComparison[ex.exercise_id] || { sets: [] };
        const completedSetsCount = (state.sets || []).filter(
          (set) => set.completed && set.weight && set.reps
        ).length;
        const templateSetsCount = templateExercise.sets || 1;
        
        if (completedSetsCount > templateSetsCount) {
          addedSetsCount += completedSetsCount - templateSetsCount;
        } else if (templateSetsCount > completedSetsCount) {
          removedSetsCount += templateSetsCount - completedSetsCount;
        }
      } else {
        // New exercise - count all its completed sets as added sets
        const state = statesForComparison[ex.exercise_id] || { sets: [] };
        const completedSetsCount = (state.sets || []).filter(
          (set) => set.completed && set.weight && set.reps
        ).length;
        addedSetsCount += completedSetsCount;
      }
    });

    // For exercises that were removed from template
    removedExercises.forEach((templateExercise) => {
      const templateSetsCount = templateExercise.sets || 1;
      removedSetsCount += templateSetsCount;
    });

    // If any changes detected, show modal
    if (
      addedExercisesCount > 0 ||
      removedExercisesCount > 0 ||
      addedSetsCount > 0 ||
      removedSetsCount > 0
    ) {
      setRoutineChanges({
        addedExercises: addedExercisesCount,
        removedExercises: removedExercisesCount,
        addedSets: addedSetsCount,
        removedSets: removedSetsCount,
      });
      setFinishModalMode("routineUpdate");
      setShowFinishModal(true);
      return true;
    }

    return false;
  };

  const finishWorkoutInternal = async (filteredExerciseStates = null) => {
    try {
      // Build workout name and date
      const now = new Date();
      const finalWorkoutName =
        workoutName || `Workout on ${now.toLocaleDateString()}`;
      const datePerformed = now.toISOString();

      // Use filtered states if provided, otherwise use current states
      const statesToUse = filteredExerciseStates || exerciseStates;

      // Build exercises array
      const exercisesPayload = exercises.map((exercise, index) => {
        const state = statesToUse[exercise.exercise_id] || {
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
      const validExercises = exercisesPayload.filter(
        (ex) => ex.sets.length > 0
      );

      if (validExercises.length === 0) {
        showWarning("No Sets Recorded", "Add an exercise");
        return;
      }

      const currentTemplateId = templateId || activeWorkout?.templateId;
      const payload = {
        name: finalWorkoutName,
        date_performed: datePerformed,
        duration: activeWorkout?.duration || 0,
        exercises: validExercises,
        templateId: currentTemplateId,
      };

      await workoutAPI.finishWorkout(payload);
      console.log("Workout saved successfully!");

      // End workout in context
      await endWorkout();
      navigation.goBack();
    } catch (err) {
      console.error("Failed to save workout:", err);
      showError("Error", "Failed to save workout. Please try again.");
    }
  };

  const handleFinish = async () => {
    hapticSuccess();
    // Check for incomplete sets first
    const incompleteSets = exercises.some((ex) => {
      const state = exerciseStates[ex.exercise_id] || { sets: [] };
      return (state.sets || []).some(
        (set) => !set.completed && set.weight && set.reps
      );
    });

    if (incompleteSets) {
      // Show incomplete sets modal
      setFinishModalMode("incompleteSets");
      setShowFinishModal(true);
      return;
    }

    // If no incomplete sets, check for routine changes
    const hasChanges = checkAndShowRoutineUpdateModal();
    if (hasChanges) {
      return;
    }

    // No incomplete sets and no routine changes (or not from routine) - proceed normally
    await finishWorkoutInternal();
  };

  const handleCompleteUnfinishedSets = async () => {
    // Mark all incomplete sets as completed
    const updatedStates = { ...exerciseStates };
    exercises.forEach((ex) => {
      const state = exerciseStates[ex.exercise_id] || { sets: [] };
      const updatedSets = (state.sets || []).map((set) => {
        if (!set.completed && set.weight && set.reps) {
          return { ...set, completed: true };
        }
        return set;
      });
      updatedStates[ex.exercise_id] = {
        ...state,
        sets: updatedSets,
      };
    });
    setExerciseStates(updatedStates);
    setProcessedExerciseStates(updatedStates);

    // Wait a bit for state to update, then check for routine changes
    setTimeout(() => {
      const hasChanges = checkAndShowRoutineUpdateModal(updatedStates);
      if (!hasChanges) {
        // No routine changes, proceed with finish
        finishWorkoutInternal(updatedStates);
      }
    }, 100);
  };

  const handleDiscardUnfinishedSets = async () => {
    // Filter out incomplete sets
    const updatedStates = { ...exerciseStates };
    exercises.forEach((ex) => {
      const state = exerciseStates[ex.exercise_id] || { sets: [] };
      const filteredSets = (state.sets || []).filter(
        (set) => set.completed || !(set.weight && set.reps)
      );
      updatedStates[ex.exercise_id] = {
        ...state,
        sets: filteredSets,
      };
    });
    setExerciseStates(updatedStates);
    setProcessedExerciseStates(updatedStates);

    // Wait a bit for state to update, then check for routine changes
    setTimeout(() => {
      const hasChanges = checkAndShowRoutineUpdateModal(updatedStates);
      if (!hasChanges) {
        // No routine changes, proceed with finish
        finishWorkoutInternal(updatedStates);
      }
    }, 100);
  };

  const handleUpdateRoutine = async () => {
    try {
      const currentTemplateId = templateId || activeWorkout?.templateId;
      if (!currentTemplateId) {
        showError("Error", "Template ID not found");
        return;
      }

      // Use processed states if available (from set completion/discard), otherwise use current states
      const statesToUse = processedExerciseStates || exerciseStates;

      // Build updated template structure based on current exercises and completed sets
      const updatedExercises = exercises.map((ex, index) => {
        const state = statesToUse[ex.exercise_id] || { sets: [] };
        const completedSetsCount = (state.sets || []).filter(
          (set) => set.completed && set.weight && set.reps
        ).length;
        return {
          exercise_id: ex.exercise_id,
          exercise_order: index + 1,
          sets: completedSetsCount || 1,
        };
      });

      // Update template
      await templateAPI.updateTemplate(currentTemplateId, {
        name: originalTemplate.name,
        is_public: originalTemplate.is_public || false,
        exercises: updatedExercises,
      });

      // Then finish workout using the processed states
      await finishWorkoutInternal(statesToUse);
      setProcessedExerciseStates(null); // Clear processed states
    } catch (error) {
      console.error("Failed to update routine:", error);
      showError("Error", "Failed to update routine. Please try again.");
    }
  };

  const handleKeepRoutineSame = async () => {
    // Finish workout without updating template (weight/reps/RIR still saved in workout)
    // Use processed states if available (from set completion/discard), otherwise use current states
    const statesToUse = processedExerciseStates || exerciseStates;
    await finishWorkoutInternal(statesToUse);
    setProcessedExerciseStates(null); // Clear processed states
  };

  const updateTotals = (exerciseId, volume, sets) => {
    setExerciseTotals((prev) => ({
      ...prev,
      [exerciseId]: { volume, sets },
    }));
  };

  useEffect(() => {
    const totals = Object.values(exerciseTotals);
    const newTotalVolume = totals.reduce(
      (sum, exercise) => sum + exercise.volume,
      0
    );
    const newTotalSets = totals.reduce(
      (sum, exercise) => sum + exercise.sets,
      0
    );

    setTotalVolume(newTotalVolume);
    setTotalSets(newTotalSets);
  }, [exerciseTotals]);

  // Global rest timer effect
  useEffect(() => {
    let interval;
    if (isTimerActive && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, remainingTime]);

  const handleSettings = (type) => {
    hapticLight();
    navigation.navigate("WorkoutSettings", { type: "workouts" });
  };

  const handleMinimizeWorkout = () => {
    // Close the screen, but keep the workout active in context
    navigation.goBack();
  };

  // Rest timer callbacks
  const handleTimerStart = (seconds) => {
    if (seconds > 0) {
      setTotalTimerTime(seconds);
      setRemainingTime(seconds);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
      setRemainingTime(0);
    }
  };

  const handleAdjustRestTime = (adjustment) => {
    setRemainingTime((prev) => {
      const newTime = Math.max(0, prev + adjustment);
      if (newTime === 0) {
        setIsTimerActive(false);
      }
      return newTime;
    });
  };

  const handleSkipRestTimer = () => {
    setIsTimerActive(false);
    setRemainingTime(0);
  };

  // Example functions showing different alert types
  const handleShowInfo = () => {
    showInfo(
      "Workout Tips",
      "Remember to maintain proper form and take adequate rest between sets for optimal results."
    );
  };

  const handleShowSuccess = () => {
    showSuccess("Great Job!", "You've completed 5 sets. Keep up the momentum!");
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
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={workoutName || "Active Workout"}
        leftComponent={{
          type: "down",
          onPress: handleMinimizeWorkout,
        }}
        rightComponent={{
          type: "button",
          text: "Finish",
          onPress: handleFinish,
        }}
      />

      <View style={styles.content}>
        {exercises.length === 0 ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.exercisesContainer,
              { paddingBottom: 300 },
            ]}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            {/* Workout Name Input - Only show if not using a template */}
            {/* {!templateId && (
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Enter workout name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            )} */}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatDuration(activeWorkout?.duration || 0)}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Exercises</Text>
                <Text style={styles.statValue}>{exercises.length}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>{totalSets}</Text>
              </View>
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
                Add an exercise to start your workout
              </Text>

              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={handleAddExercise}
              >
                <Ionicons name="add" size={20} color={colors.textWhite} />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleSettings}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.settingsText}>Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={handleDiscard}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.accentRed}
                  />
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
            contentContainerStyle={[
              styles.exercisesContainer,
              { paddingBottom: 300 },
            ]}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
            ListHeaderComponent={() => (
              <View>
                {/* Workout Name Input - Only show if not using a template */}
                {/* {!templateId && (
                  <View style={styles.nameInputContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={workoutName}
                      onChangeText={setWorkoutName}
                      placeholder="Enter workout name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                )} */}

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Duration</Text>
                    <Text style={styles.statValue}>
                      {formatDuration(activeWorkout?.duration || 0)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Exercises</Text>
                    <Text style={styles.statValue}>{exercises.length}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Sets</Text>
                    <Text style={styles.statValue}>{totalSets}</Text>
                  </View>
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
                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={handleSettings}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={20}
                      color={colors.textPrimary}
                    />
                    <Text style={styles.settingsText}>Workout Settings</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.discardButton}
                    onPress={handleDiscard}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.accentRed}
                    />
                    <Text style={styles.discardText}>Discard Workout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Active rest timer at bottom */}
      <ActiveRestTimer
        remainingTime={remainingTime}
        totalTime={totalTimerTime}
        onAdjustTime={handleAdjustRestTime}
        onSkip={handleSkipRestTimer}
        visible={isTimerActive}
      />

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
      <FinishWorkoutModal
        visible={showFinishModal}
        onClose={() => {
          setShowFinishModal(false);
          setFinishModalMode(null);
        }}
        mode={finishModalMode}
        newExercisesCount={routineChanges.addedExercises}
        newSetsCount={routineChanges.addedSets}
        addedExercises={routineChanges.addedExercises}
        removedExercises={routineChanges.removedExercises}
        addedSets={routineChanges.addedSets}
        removedSets={routineChanges.removedSets}
        onCompleteSets={handleCompleteUnfinishedSets}
        onDiscardSets={handleDiscardUnfinishedSets}
        onUpdateRoutine={handleUpdateRoutine}
        onKeepRoutineSame={handleKeepRoutineSame}
      />
    </SafeAreaView>
  );
};

export default ActiveWorkoutPage;
