import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/workout.styles";
import colors from "../constants/colors";
import { WorkoutAPI } from "../API/WorkoutAPI";

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
        const response = await WorkoutAPI.getWorkoutById(workout_id);
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
    <View style={styles.detailContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Detail</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerAction}>Edit</Text>
        </TouchableOpacity>
      </View>

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
          const exercise = exerciseData.exercises; // Get the exercise details from the joined data
          return (
            <View
              key={exerciseData.workout_exercises_id}
              style={styles.exerciseCard}
            >
              <Text style={styles.exerciseCardTitle}>{exercise.name}</Text>
              {exerciseData.notes && (
                <Text style={styles.exerciseNotes}>{exerciseData.notes}</Text>
              )}
              <View style={styles.setHeader}>
                <Text style={styles.setHeaderText}>SET</Text>
                <Text style={styles.setHeaderText}>WEIGHT & REPS</Text>
              </View>
              {exerciseData.sets?.map((set, setIdx) => (
                <View key={set.set_id} style={styles.setRow}>
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
    </View>
  );
};

export default WorkoutDetail;
