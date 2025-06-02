import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { WorkoutAPI } from "../API/WorkoutAPI";
import styles from "../styles/display.styles";

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const WorkoutHistory = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const data = await WorkoutAPI.getWorkouts();
        setWorkouts(data);
      } catch (err) {
        setError("Failed to load workouts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  const renderExercisePreview = (exercises) => {
    if (!exercises || exercises.length === 0) return null;
    return exercises.slice(0, 3).map((ex, idx) => {
      const setCount = ex.sets ? ex.sets.length : 0;
      let firstSet = "";
      if (
        ex.sets &&
        ex.sets.length > 0 &&
        ex.sets[0].weight &&
        ex.sets[0].reps
      ) {
        firstSet = `${ex.sets[0].weight} lbs x ${ex.sets[0].reps} reps`;
      }
      return (
        <View
          key={idx}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <Text style={[styles.exerciseName, { fontSize: 15, marginRight: 6 }]}>
            {setCount} sets{" "}
          </Text>
          <Text
            style={[
              styles.exerciseMuscleGroup,
              { fontSize: 15, marginRight: 6 },
            ]}
          >
            {ex.name}
          </Text>
          {firstSet ? (
            <Text style={[styles.exerciseMuscleGroup, { fontSize: 15 }]}>
              {firstSet}
            </Text>
          ) : null}
        </View>
      );
    });
  };

  const renderWorkoutCard = ({ item }) => {
    const totalSets = item.exercises
      ? item.exercises.reduce(
          (sum, ex) => sum + (ex.sets ? ex.sets.length : 0),
          0
        )
      : 0;
    return (
      <TouchableOpacity
        style={[
          styles.exerciseItem,
          {
            backgroundColor: "#181A20",
            borderRadius: 12,
            marginBottom: 16,
            padding: 16,
          },
        ]}
        onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
      >
        <Text style={[styles.exerciseName, { fontSize: 20, marginBottom: 2 }]}>
          {item.name}
        </Text>
        <Text
          style={[
            styles.exerciseMuscleGroup,
            { fontSize: 15, marginBottom: 2 },
          ]}
        >
          {formatDate(item.date_performed)}
        </Text>
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          <Text style={[styles.exerciseMuscleGroup, { marginRight: 16 }]}>
            Duration: {Math.round(item.duration / 60)} min
          </Text>
          <Text style={[styles.exerciseMuscleGroup, { marginRight: 16 }]}>
            Volume: {item.total_volume || 0} lbs
          </Text>
          <Text style={styles.exerciseMuscleGroup}>Sets: {totalSets}</Text>
        </View>
        {renderExercisePreview(item.exercises)}
        {item.exercises && item.exercises.length > 3 && (
          <Text
            style={[styles.exerciseMuscleGroup, { fontSize: 14, marginTop: 2 }]}
          >
            See {item.exercises.length - 3} more exercises
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#47A3FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.emptyListText}>No workout history</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: 16 }]}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.workout_id || item.id)}
        renderItem={renderWorkoutCard}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default WorkoutHistory;
