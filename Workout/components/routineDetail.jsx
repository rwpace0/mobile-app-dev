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
import { Spacing, FontSize } from "../constants/theme";
import { useTheme } from "../state/SettingsContext";
import workoutAPI from "../API/workoutAPI";
import templateAPI from "../API/templateAPI";
import Header from "./header";

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

const RoutineDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { template_id } = route.params || {};
  const [workout, setWorkout] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutineDetails = useCallback(
    async (showLoading = true) => {
      try {
        if (!template_id) {
          throw new Error("No template ID provided");
        }
        if (showLoading) setLoading(true);
        setError(null);

        // Fetch both template info and last workout
        const [templateResponse, lastWorkoutResponse] = await Promise.all([
          templateAPI.getTemplateById(template_id),
          workoutAPI.getLastWorkoutForTemplate(template_id),
        ]);

        setTemplate(templateResponse);
        setWorkout(lastWorkoutResponse);

        if (!lastWorkoutResponse) {
          setError("No previous workouts found for this routine");
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
    navigation.navigate("WorkoutStart", {
      template_id: template_id,
    });
  }, [navigation, template_id]);

  const handleEditTemplate = useCallback(() => {
    navigation.navigate("EditTemplate", {
      template_id: template_id,
    });
  }, [navigation, template_id]);

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

  if (error || !workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Routine Details" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            {error || "No previous workouts found"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchRoutineDetails()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
          {template && (
            <TouchableOpacity
              style={[
                styles.retryButton,
                { marginTop: Spacing.s, backgroundColor: colors.primaryBlue },
              ]}
              onPress={handleStartWorkout}
            >
              <Text style={[styles.retryText, { color: colors.white }]}>
                Start First Workout
              </Text>
            </TouchableOpacity>
          )}
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
          <Text style={styles.detailTitle}>{workout.name}</Text>
          <Text
            style={[
              styles.detailDate,
              { opacity: 0.8, fontSize: FontSize.caption, marginTop: Spacing.xxs },
            ]}
          >
            Last performed: {formatDate(workout.date_performed)}
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

        <TouchableOpacity
          style={styles.startRoutineButton}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startRoutineText}>Start Routine</Text>
        </TouchableOpacity>

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

export default RoutineDetail;
