import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import workoutAPI from "../API/workoutAPI";
import exercisesAPI from "../API/exercisesAPI";
import Header from "../components/header";
import styles from "../styles/workoutHistory.styles";
import colors from "../constants/colors";

const WorkoutHistoryPage = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);
      const workoutData = await workoutAPI.getWorkouts();

      // Fetch exercise details for each workout
      const workoutsWithDetails = await Promise.all(
        workoutData.map(async (workout) => {
          try {
            const exercisesWithDetails = await Promise.all(
              (workout.exercises || []).map(async (exercise) => {
                if (!exercise || !exercise.exercise_id) {
                  return {
                    exercise_id: 'unknown',
                    name: 'Unknown Exercise',
                    muscle_group: '',
                    sets: []
                  };
                }

                try {
                  const details = await exercisesAPI.getExerciseById(exercise.exercise_id);
                  return {
                    ...exercise,
                    name: details?.name || 'Unknown Exercise',
                    muscle_group: details?.muscle_group || '',
                    sets: exercise.sets || []
                  };
                } catch (err) {
                  console.error(`Failed to fetch exercise ${exercise.exercise_id}:`, err);
                  return {
                    ...exercise,
                    name: 'Unknown Exercise',
                    muscle_group: '',
                    sets: exercise.sets || []
                  };
                }
              })
            );

            return {
              ...workout,
              exercises: exercisesWithDetails.filter(ex => ex !== null && ex !== undefined)
            };
          } catch (err) {
            console.error(`Failed to process workout ${workout.workout_id}:`, err);
            return {
              ...workout,
              exercises: []
            };
          }
        })
      );

      setWorkouts(workoutsWithDetails);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
      setError("Failed to load workout history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.toLocaleDateString(undefined, { weekday: 'long' });
      const month = date.toLocaleDateString(undefined, { month: 'long' });
      const dateNum = date.getDate();
      return `${day}, ${month} ${dateNum}`;
    } catch (err) {
      return "Invalid Date";
    }
  };

  const renderWorkoutCard = (workout) => {
    const duration = Math.round((workout.duration || 0) / 60);
    const volume = workout.total_volume || 0;

    return (
      <TouchableOpacity
        key={workout.workout_id}
        style={styles.workoutCard}
        onPress={() => navigation.navigate("WorkoutDetail", { workout })}
      >
        <Text style={styles.workoutTitle}>{workout.name || "Workout"}</Text>
        <Text style={styles.workoutDate}>{formatDate(workout.date_performed)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItemWithIcon}>
            <Ionicons name="time-outline" size={20} color={colors.textLight} style={styles.statIcon} />
            <Text style={styles.statText}>{duration}m</Text>
          </View>
          <View style={styles.statItemWithIcon}>
            <Ionicons name="barbell-outline" size={20} color={colors.textLight} style={styles.statIcon} />
            <Text style={styles.statText}>{volume} lb</Text>
          </View>
        </View>

        <View style={styles.exerciseList}>
          {(workout.exercises || []).map((exercise, index) => {
            if (!exercise) return null;
            const sets = exercise.sets?.length || 0;
            const exerciseName = exercise.name || "Unknown Exercise";
            const bestSet = exercise.sets?.reduce((best, current) => 
              (current.weight > best.weight) ? current : best
            , exercise.sets?.[0]);

            return (
              <View key={index} style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>
                    {sets} × {exerciseName}
                  </Text>
                </View>
                <Text style={styles.bestSet}>
                  {bestSet ? `${bestSet.weight} lb × ${bestSet.reps}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="History" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerAction}>Calendar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
        {error ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>No workouts found</Text>
          </View>
        ) : (
          workouts.map(workout => renderWorkoutCard(workout))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutHistoryPage;
