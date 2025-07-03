import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "../styles/workoutHistory.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import workoutAPI from "../API/workoutAPI";
import Header from "../components/header";

const formatDate = (isoString) => {
  try {
    const date = new Date(isoString);
    const day = date.toLocaleDateString(undefined, { weekday: "long" });
    const month = date.toLocaleDateString(undefined, { month: "long" });
    const dateNum = date.getDate();
    return `${day}, ${month} ${dateNum}`;
  } catch (err) {
    console.error("Date formatting error:", err);
    return "Invalid Date";
  }
};

const calculateVolume = (sets) => {
  return sets.reduce((total, set) => {
    return total + (set.weight * set.reps || 0);
  }, 0);
};

const WorkoutDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { workout_id } = route.params || {};
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const totalVolume = workout.exercises?.reduce((total, ex) => {
    return total + calculateVolume(ex.sets || []);
  }, 0);

  const totalSets = workout.exercises?.reduce((total, ex) => {
    return total + (ex.sets?.length || 0);
  }, 0);

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
          <View style={styles.statsRow}>
            <View style={styles.statItemWithIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>
                {Math.round(workout.duration / 60)}m
              </Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <Ionicons
                name="barbell-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>{Math.round(totalVolume)} kg</Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <Ionicons
                name="list-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>{totalSets} sets</Text>
            </View>
          </View>
        </View>
        {workout.exercises?.map((exerciseData, idx) => {
          if (!exerciseData || !exerciseData.workout_exercises_id) return null;
          return (
            <View
              key={exerciseData.workout_exercises_id}
              style={styles.exerciseCard}
            >
              <TouchableOpacity
                onPress={() => handleExercisePress(exerciseData)}
              >
                <Text style={styles.exerciseCardTitle}>
                  {exerciseData.name || "Unknown Exercise"}
                </Text>
              </TouchableOpacity>

              {exerciseData.notes && (
                <Text style={styles.exerciseNotes}>{exerciseData.notes}</Text>
              )}
              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>SET</Text>
                <Text style={styles.setHeaderText}>WEIGHT & REPS</Text>
                <Text style={styles.setHeaderText}>RIR</Text>
              </View>
              {(exerciseData.sets || []).map((set, setIdx) => (
                <View key={set.set_id || setIdx} style={styles.setRow}>
                  <Text style={styles.setNumber}>
                    {set.set_order || setIdx + 1}
                  </Text>
                  <Text style={styles.setValue}>
                    {set.weight}kg × {set.reps} reps
                  </Text>
                  <Text style={styles.setValue}>
                    {set.rir !== null && set.rir !== undefined
                      ? `${set.rir}`
                      : "-"}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutDetail;
