import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/workoutHistory.styles";
import colors from "../constants/colors";
import workoutAPI from "../API/workoutAPI";
import exercisesAPI from "../API/exercisesAPI";
import Header from "../components/header";

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = date.toLocaleDateString(undefined, { month: "long" });
  const dateNum = date.getDate();
  return `${day}, ${month} ${dateNum}`;
};

const calculateVolume = (sets) => {
  return sets.reduce((total, set) => {
    return total + (set.weight * set.reps || 0);
  }, 0);
};

const WorkoutDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workout_id } = route.params?.workout || {};
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      try {
        if (!workout_id) {
          throw new Error("No workout ID provided");
        }
        const response = await workoutAPI.getWorkoutById(workout_id);
        
        // Fetch exercise details for each exercise
        if (response.exercises) {
          const exercisesWithDetails = await Promise.all(
            response.exercises.map(async (exercise) => {
              if (!exercise || !exercise.exercise_id) return null;
              try {
                const details = await exercisesAPI.getExerciseById(exercise.exercise_id);
                return {
                  ...exercise,
                  name: details?.name || 'Unknown Exercise',
                  muscle_group: details?.muscle_group || ''
                };
              } catch (err) {
                console.error(`Failed to fetch exercise ${exercise.exercise_id}:`, err);
                return {
                  ...exercise,
                  name: 'Unknown Exercise',
                  muscle_group: ''
                };
              }
            })
          );
          response.exercises = exercisesWithDetails.filter(ex => ex !== null);
        }
        
        setWorkout(response);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching workout:", err);
        setError("Failed to load workout details");
        setLoading(false);
      }
    };

    fetchWorkoutDetails();
  }, [workout_id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || "Workout not found"}</Text>
      </View>
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
        leftComponent={{ type: 'back' }}
        rightComponent={{
          type: 'button',
          text: 'Edit',
          onPress: () => console.log('Edit workout')
        }}
      />

      <ScrollView style={{ flex: 1 }}>
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
                color={colors.textLight}
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
                color={colors.textLight}
                style={styles.statIcon}
              />
              <Text style={styles.statText}>{Math.round(totalVolume)} lb</Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <Ionicons
                name="list-outline"
                size={20}
                color={colors.textLight}
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
              <Text style={styles.exerciseCardTitle}>{exerciseData.name || "Unknown Exercise"}</Text>
              {exerciseData.muscle_group && (
                <Text style={styles.exerciseSubtitle}>{exerciseData.muscle_group}</Text>
              )}
              {exerciseData.notes && (
                <Text style={styles.exerciseNotes}>{exerciseData.notes}</Text>
              )}
              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>SET</Text>
                <Text style={styles.setHeaderText}>WEIGHT & REPS</Text>
              </View>
              {(exerciseData.sets || []).map((set, setIdx) => (
                <View key={set.set_id || setIdx} style={styles.setRow}>
                  <Text style={styles.setNumber}>
                    {set.set_order || setIdx + 1}
                  </Text>
                  <Text style={styles.setValue}>
                    {set.weight}lb × {set.reps} reps
                    {set.rir ? ` @RIR ${set.rir}` : ""}
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
