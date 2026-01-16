import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import workoutAPI from "../../API/workoutAPI";
import exercisesAPI from "../../API/exercisesAPI";
import Header from "../../components/static/header";
import { useWeight } from "../../utils/useWeight";
import { format, parseISO } from "date-fns";
import { hapticLight } from "../../utils/hapticFeedback";

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

const WorkoutDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const { workout_id } = route.params || {};
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exerciseHistories, setExerciseHistories] = useState({});
  const [exercisePRs, setExercisePRs] = useState({});

  const fetchWorkoutDetails = useCallback(
    async (showLoading = true) => {
      try {
        if (!workout_id) {
          throw new Error("No workout ID provided");
        }
        if (showLoading) setLoading(true);
        setError(null);

        const response = await workoutAPI.getWorkoutById(workout_id);
        setWorkout(response);

        // Fetch exercise histories for performance indicators and PR calculation
        if (response?.exercises) {
          const histories = {};
          const prs = {};

          await Promise.all(
            response.exercises.map(async (exercise) => {
              try {
                const history = await exercisesAPI.getExerciseHistory(
                  exercise.exercise_id
                );
                histories[exercise.exercise_id] = history || [];

                // Calculate PR for this exercise
                let bestPerformance = 0;
                let bestWorkoutId = null;
                let bestSetIds = new Set();

                // First pass: find the best performance value
                history?.forEach((workout) => {
                  workout.sets?.forEach((set) => {
                    const performance =
                      (set.weight || 0) *
                      (set.reps || 0) *
                      (set.rir !== null && set.rir !== undefined
                        ? set.rir
                        : 1);

                    if (performance > bestPerformance) {
                      bestPerformance = performance;
                    }
                  });
                });

                // Second pass: find the most recent workout that achieved this performance
                if (history) {
                  for (const workout of history) {
                    if (workout.sets && workout.sets.length > 0) {
                      const workoutHasPR = workout.sets.some((set) => {
                        const performance =
                          (set.weight || 0) *
                          (set.reps || 0) *
                          (set.rir !== null && set.rir !== undefined
                            ? set.rir
                            : 1);
                        return performance === bestPerformance;
                      });

                      if (workoutHasPR) {
                        bestWorkoutId = workout.workout_exercises_id;
                        // Collect all set IDs in this workout that match the PR
                        workout.sets.forEach((set) => {
                          const performance =
                            (set.weight || 0) *
                            (set.reps || 0) *
                            (set.rir !== null && set.rir !== undefined
                              ? set.rir
                              : 1);
                          if (performance === bestPerformance) {
                            bestSetIds.add(set.set_id);
                          }
                        });
                        break; // Stop at the most recent workout with PR
                      }
                    }
                  }
                }

                prs[exercise.exercise_id] = {
                  performance: bestPerformance,
                  workoutId: bestWorkoutId,
                  setIds: bestSetIds,
                };
              } catch (err) {
                console.error(
                  `Error fetching history for exercise ${exercise.exercise_id}:`,
                  err
                );
              }
            })
          );

          setExerciseHistories(histories);
          setExercisePRs(prs);
        }
      } catch (err) {
        console.error("Error fetching workout:", err);
        setError(err.message || "Failed to load workout details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workout_id]
  );

  useEffect(() => {
    fetchWorkoutDetails();
  }, [fetchWorkoutDetails]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkoutDetails(false);
  }, [fetchWorkoutDetails]);

  const handleExercisePress = useCallback(
    (exercise) => {
      navigation.navigate("ExerciseDetail", {
        exerciseId: exercise.exercise_id,
      });
    },
    [navigation]
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Workout Detail" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Workout Detail" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error || "Workout not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchWorkoutDetails()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = workout.exercises?.reduce((total, ex) => {
    return total + (ex.sets?.length || 0);
  }, 0);

  const totalExercises = workout.exercises?.length || 0;

  return (
    <SafeAreaView style={styles.detailContainer}>
      <Header
        title="Workout Detail"
        leftComponent={{ type: "back" }}
        rightComponent={{
          type: "button",
          text: "Edit",
          onPress: () => navigation.navigate("editWorkout", { workout_id }),
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{workout.name}</Text>

          <Text style={styles.detailDate}>
            {formatDate(workout.date_performed)}
          </Text>
          <View style={styles.detailStatsRow}>
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
        </View>
        {workout.exercises?.map((exerciseData, idx) => {
          if (!exerciseData || !exerciseData.workout_exercises_id) return null;

          // Get history and PR for this exercise
          const exerciseHistory =
            exerciseHistories[exerciseData.exercise_id] || [];
          const exercisePR = exercisePRs[exerciseData.exercise_id];

          // Find the previous workout for this exercise (skip current workout)
          const previousWorkout = exerciseHistory.find(
            (h) => h.workout_exercises_id !== exerciseData.workout_exercises_id
          );

          return (
            <View
              key={exerciseData.workout_exercises_id}
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

              {exerciseData.notes && (
                <Text style={styles.exerciseNotes}>{exerciseData.notes}</Text>
              )}
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
                {(exerciseData.sets || []).map((set, setIdx) => {
                  // Calculate performance indicators
                  const prevSet = previousWorkout?.sets?.[setIdx];
                  let indicators = [];

                  if (prevSet) {
                    // Calculate weight difference
                    const weightDiff = (set.weight || 0) - (prevSet.weight || 0);
                    // Only show if difference is significant (≥ 0.5 in current unit)
                    if (Math.abs(weightDiff) >= 0.5) {
                      const formattedWeight = weight.format(
                        Math.abs(weightDiff)
                      );
                      indicators.push({
                        text: `${weightDiff > 0 ? "+" : "-"}${formattedWeight}`,
                        isIncrease: weightDiff > 0,
                      });
                    }

                    // Calculate reps difference
                    const repsDiff = (set.reps || 0) - (prevSet.reps || 0);
                    if (repsDiff !== 0) {
                      indicators.push({
                        text: `${repsDiff > 0 ? "+" : ""}${repsDiff} rep${
                          Math.abs(repsDiff) !== 1 ? "s" : ""
                        }`,
                        isIncrease: repsDiff > 0,
                      });
                    }
                  }

                  // Check if this set is a PR (only in the most recent workout that achieved the best performance)
                  const isPR =
                    exercisePR &&
                    exerciseData.workout_exercises_id === exercisePR.workoutId &&
                    exercisePR.setIds.has(set.set_id);

                  return (
                    <View
                      key={set.set_id || setIdx}
                      style={[
                        styles.setRow,
                        setIdx % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
                      ]}
                    >
                      <Text style={styles.setNumber}>
                        {set.set_order || setIdx + 1}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Text style={styles.setInfo}>
                          {weight.formatSet(set.weight, set.reps)} reps
                        </Text>
                        {indicators.map((indicator, idx) => (
                          <Text
                            key={idx}
                            style={[
                              styles.setIndicator,
                              indicator.isIncrease
                                ? styles.setIndicatorIncrease
                                : styles.setIndicatorDecrease,
                            ]}
                          >
                            {indicator.text}
                          </Text>
                        ))}
                        {isPR && (
                          <Ionicons
                            name="trophy"
                            size={16}
                            color={colors.accentGold}
                            style={styles.prIcon}
                          />
                        )}
                      </View>
                      <Text style={styles.setRir}>
                        {set.rir !== null && set.rir !== undefined
                          ? `${set.rir}`
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
    </SafeAreaView>
  );
};

export default WorkoutDetail;
