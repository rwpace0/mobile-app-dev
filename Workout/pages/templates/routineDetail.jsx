import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { createStyles } from "../../styles/workoutHistory.styles";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import { useActiveWorkout } from "../../state/ActiveWorkoutContext";
import workoutAPI from "../../API/workoutAPI";
import templateAPI from "../../API/templateAPI";
import exercisesAPI from "../../API/exercisesAPI";
import Header from "../../components/static/header";
import { useWeight } from "../../utils/useWeight";
import ActiveWorkoutModal from "../../components/modals/ActiveWorkoutModal";
import { format, parseISO } from "date-fns";
import { hapticLight, hapticSuccess } from "../../utils/hapticFeedback";

const ExerciseImage = ({ exercise, colors, styles }) => {
  const [imageError, setImageError] = useState(false);

  const imagePath = exercise.local_media_path
    ? `${FileSystem.cacheDirectory}app_media/exercises/${exercise.local_media_path}`
    : null;

  return (
    <View style={styles.exerciseIconContainer}>
      {imagePath && !imageError ? (
        <Image
          source={{ uri: `file://${imagePath}` }}
          style={styles.exerciseImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Ionicons name="barbell" size={24} color={colors.textPrimary} />
      )}
    </View>
  );
};

const formatDate = (isoString) => {
  try {
    const date = parseISO(isoString);
    return format(date, "h:mm a, EEEE, MMM d, yyyy");
  } catch (err) {
    console.error("Date formatting error:", err);
    return "Invalid Date";
  }
};

const formatDuration = (seconds) => {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  } else {
    return `${totalMinutes}m`;
  }
};

const RoutineDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const { activeWorkout, isWorkoutActive, endWorkout } = useActiveWorkout();
  const { template_id } = route.params || {};
  const [workout, setWorkout] = useState(null);
  const [template, setTemplate] = useState(null);
  const [templateExercisesWithNames, setTemplateExercisesWithNames] = useState(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showActiveWorkoutModal, setShowActiveWorkoutModal] = useState(false);
  const [pendingWorkoutAction, setPendingWorkoutAction] = useState(null);

  const fetchRoutineDetails = useCallback(
    async (showLoading = true) => {
      try {
        if (!template_id) {
          throw new Error("No template ID provided");
        }
        if (showLoading) setLoading(true);
        setError(null);

        // Fetch template info and check if routine has been performed
        const [templateResponse, lastWorkoutResponse] = await Promise.all([
          templateAPI.getTemplateById(template_id),
          workoutAPI.getLastWorkoutForTemplate(template_id),
          //console.log("Template ID:", template_id),
        ]);

        setTemplate(templateResponse);
        setWorkout(lastWorkoutResponse);
        //console.log("Template:", templateResponse);
        //console.log("Last workout:", lastWorkoutResponse);

        // Always fetch exercise names and recent data for template exercises
        // This ensures we always show the actual routine structure, not workout data
        if (templateResponse?.exercises) {
          const exercisesWithNames = await Promise.all(
            templateResponse.exercises.map(async (exercise) => {
              const [exerciseDetails, exerciseHistory] = await Promise.all([
                exercisesAPI.getExerciseById(exercise.exercise_id),
                exercisesAPI.getExerciseHistory(exercise.exercise_id), // Get exercise history
              ]);

              return {
                ...exercise,
                name: exerciseDetails?.name || "Unknown Exercise",
                muscle_group: exerciseDetails?.muscle_group || "",
                recentSets:
                  exerciseHistory?.length > 0 ? exerciseHistory[0].sets : null,
              };
            })
          );
          setTemplateExercisesWithNames(exercisesWithNames);
        }

        // Set error only if template doesn't exist
        if (!templateResponse) {
          setError("Failed to load routine data");
        }
      } catch (err) {
        console.error("Error fetching routine details:", err);
        setError(err.message || "Failed to load routine details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [template_id]
  );

  useEffect(() => {
    fetchRoutineDetails();
  }, [fetchRoutineDetails]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRoutineDetails(false);
  }, [fetchRoutineDetails]);

  const handleExercisePress = useCallback(
    (exercise) => {
      navigation.navigate("ExerciseDetail", {
        exerciseId: exercise.exercise_id,
      });
    },
    [navigation]
  );

  const handleStartWorkout = useCallback(() => {
    if (!template || !template.exercises) {
      console.error("Template data not available");
      return;
    }

    if (isWorkoutActive) {
      setPendingWorkoutAction(() => () => {
        // Transform template exercises into the format expected by activeWorkout
        const selectedExercises = template.exercises.map((exercise) => {
          // Get weight, reps, and RIR from template
          let initialWeight = "";
          let initialReps = "";
          let initialRir = "";

          if (exercise.weight !== null && exercise.weight !== undefined) {
            const convertedWeight = weight.fromStorage(exercise.weight);
            const roundedWeight = weight.roundToHalf(convertedWeight);
            initialWeight = roundedWeight.toString();
          }

          // Handle reps - single value or range
          if (
            exercise.rep_range_min !== null &&
            exercise.rep_range_min !== undefined &&
            exercise.rep_range_max !== null &&
            exercise.rep_range_max !== undefined
          ) {
            initialReps = `${exercise.rep_range_min}-${exercise.rep_range_max}`;
          } else if (exercise.reps !== null && exercise.reps !== undefined) {
            initialReps = exercise.reps.toString();
          }

          // Handle RIR - single value or range
          if (
            exercise.rir_range_min !== null &&
            exercise.rir_range_min !== undefined &&
            exercise.rir_range_max !== null &&
            exercise.rir_range_max !== undefined
          ) {
            initialRir = `${exercise.rir_range_min}-${exercise.rir_range_max}`;
          } else if (exercise.rir !== null && exercise.rir !== undefined) {
            initialRir = exercise.rir.toString();
          }

          return {
            exercise_id: exercise.exercise_id,
            name: exercise.name,
            muscle_group: exercise.muscle_group,
            // Preserve template range data for placeholder use
            rep_range_min: exercise.rep_range_min,
            rep_range_max: exercise.rep_range_max,
            rir_range_min: exercise.rir_range_min,
            rir_range_max: exercise.rir_range_max,
            sets: Array(exercise.sets || 1)
              .fill()
              .map((_, idx) => ({
                id: (idx + 1).toString(),
                weight: idx === 0 ? initialWeight : "",
                reps: idx === 0 ? initialReps : "",
                rir: idx === 0 ? initialRir : "",
                completed: false,
              })),
          };
        });

        // Navigate to activeWorkout with the exercises and template ID
        navigation.navigate("activeWorkout", {
          selectedExercises,
          workoutName: template.name,
          templateId: template_id, // Pass template ID to link workout to template
        });
      });
      setShowActiveWorkoutModal(true);
    } else {
      // Transform template exercises into the format expected by activeWorkout
      const selectedExercises = template.exercises.map((exercise) => ({
        exercise_id: exercise.exercise_id,
        name: exercise.name,
        muscle_group: exercise.muscle_group,
        // Preserve template range data for placeholder use
        rep_range_min: exercise.rep_range_min,
        rep_range_max: exercise.rep_range_max,
        rir_range_min: exercise.rir_range_min,
        rir_range_max: exercise.rir_range_max,
        sets: Array(exercise.sets || 1)
          .fill()
          .map((_, idx) => ({
            id: (idx + 1).toString(),
            weight: "",
            reps: "",
            rir: "",
            completed: false,
          })),
      }));

      // Navigate to activeWorkout with the exercises and template ID
      navigation.navigate("activeWorkout", {
        selectedExercises,
        workoutName: template.name,
        templateId: template_id, // Pass template ID to link workout to template
      });
    }
  }, [navigation, template, isWorkoutActive, template_id]);

  const handleEditTemplate = useCallback(() => {
    navigation.navigate("EditTemplate", {
      template_id: template_id,
    });
  }, [navigation, template_id]);

  const handleResumeWorkout = useCallback(() => {
    navigation.navigate("activeWorkout");
  }, [navigation]);

  const handleStartNewWorkout = useCallback(async () => {
    try {
      // End the current active workout first and wait for it to complete
      await endWorkout();

      // Then execute the pending workout action (start new workout)
      if (pendingWorkoutAction) {
        pendingWorkoutAction();
        setPendingWorkoutAction(null);
      }
    } catch (error) {
      console.error("Failed to end workout before starting new one:", error);
      // Still proceed with the new workout even if cleanup fails
      if (pendingWorkoutAction) {
        pendingWorkoutAction();
        setPendingWorkoutAction(null);
      }
    }
  }, [pendingWorkoutAction, endWorkout]);

  const handleCloseActiveWorkoutModal = useCallback(() => {
    setShowActiveWorkoutModal(false);
    setPendingWorkoutAction(null);
  }, []);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Routine Details" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !template) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Routine Details" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            {error || "Failed to load routine data"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              hapticLight();
              fetchRoutineDetails();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Always use template data for the routine structure
  const displayData = template;

  // Check if workout is "meaningful" - has exercises with sets
  // A workout is meaningful if it has at least one exercise with at least one set
  const hasMeaningfulWorkout =
    workout &&
    workout.exercises &&
    workout.exercises.length > 0 &&
    workout.exercises.some((ex) => ex.sets && ex.sets.length > 0);

  // Always use template data for exercise and set counts
  const totalSets =
    template?.exercises?.reduce((total, ex) => {
      return total + (ex.sets || 1);
    }, 0) || 0;

  const totalExercises = template?.exercises?.length || 0;

  return (
    <SafeAreaView style={styles.detailContainer}>
      <Header
        title="Routine Details"
        leftComponent={{ type: "back" }}
        rightComponent={{
          type: "button",
          text: "Edit",
          onPress: handleEditTemplate,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{displayData.name}</Text>

          {hasMeaningfulWorkout ? (
            <Text style={styles.detailDate}>
              Last performed: {formatDate(workout.date_performed)}
            </Text>
          ) : (
            <Text style={styles.detailDate}>Never performed</Text>
          )}
          <View style={styles.detailStatsRow}>
            {hasMeaningfulWorkout && (
              <View style={styles.statItemWithIcon}>
                <View style={styles.statIconContainer}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.textPrimary}
                  />
                </View>
                <Text style={styles.statText}>
                  {formatDuration(workout.duration || 0)}
                </Text>
              </View>
            )}
            <View style={styles.statItemWithIcon}>
              <View style={styles.statIconContainer}>
                <Ionicons name="barbell" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.statText}>
                {totalExercises}{" "}
                {totalExercises === 1 ? "exercise" : "exercises"}
              </Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
              <Text style={styles.statText}>{totalSets} sets</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.startRoutineButton}
            onPress={handleStartWorkout}
          >
            <Text style={styles.startRoutineText}>Start Routine</Text>
          </TouchableOpacity>
        </View>

        {/* Always display template exercises (the actual routine structure) */}
        {templateExercisesWithNames?.map((exerciseData, idx) => {
          return (
            <View
              key={exerciseData.exercise_id || idx}
              style={styles.exerciseContainer}
            >
              <TouchableOpacity
                onPress={() => {
                  hapticLight();
                  handleExercisePress(exerciseData);
                }}
                style={styles.exerciseTitleRow}
              >
                <ExerciseImage
                  exercise={exerciseData}
                  colors={colors}
                  styles={styles}
                />
                <Text style={styles.exerciseCardTitle}>
                  {exerciseData.name || "Unknown Exercise"}
                </Text>
              </TouchableOpacity>

              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={[styles.setsHeaderText, styles.setHeaderColumn]}>
                    SET
                  </Text>
                  <Text
                    style={[
                      styles.setsHeaderText,
                      { flex: 1, marginLeft: Spacing.m },
                    ]}
                  >
                    WEIGHT × REPS
                  </Text>
                  <Text style={[styles.setsHeaderText, styles.rirHeaderColumn]}>
                    RIR
                  </Text>
                </View>
                {Array(exerciseData.sets || 1)
                  .fill()
                  .map((_, setIdx) => {
                    // Use recent data if available, otherwise show placeholders
                    const recentSet = exerciseData.recentSets?.[setIdx];
                    return (
                      <View
                        key={setIdx}
                        style={[
                          styles.setRow,
                          setIdx % 2 === 0
                            ? styles.setRowEven
                            : styles.setRowOdd,
                        ]}
                      >
                        <Text style={styles.setNumber}>{setIdx + 1}</Text>
                        <Text
                          style={[
                            styles.setInfo,
                            { opacity: recentSet ? 1 : 0.5 },
                          ]}
                        >
                          {recentSet
                            ? `${weight.formatSet(
                                recentSet.weight,
                                recentSet.reps
                              )}`
                            : "-"}
                        </Text>
                        <Text
                          style={[
                            styles.setRir,
                            { opacity: recentSet ? 1 : 0.5 },
                          ]}
                        >
                          {recentSet &&
                          recentSet.rir !== null &&
                          recentSet.rir !== undefined
                            ? `${recentSet.rir} RIR`
                            : "-"}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ActiveWorkoutModal
        visible={showActiveWorkoutModal}
        onClose={handleCloseActiveWorkoutModal}
        onResumeWorkout={handleResumeWorkout}
        onStartNew={handleStartNewWorkout}
      />
    </SafeAreaView>
  );
};

export default RoutineDetail;
