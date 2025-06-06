import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { WorkoutAPI } from "../API/workoutAPI";
import styles from "../styles/workoutHistory.styles";
import colors from "../constants/colors";
import { Spacing } from "../constants/theme";
import { Ionicons } from '@expo/vector-icons';

const formatDate = (isoString) => {
  const date = new Date(isoString);
  const day = date.toLocaleDateString(undefined, { weekday: 'long' });
  const month = date.toLocaleDateString(undefined, { month: 'long' });
  const dateNum = date.getDate();
  return `${day}, ${month} ${dateNum}`;
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

  const renderWorkoutCard = ({ item }) => {
    const duration = Math.round(item.duration / 60);
    const volume = item.total_volume || 0;
    const prs = item.personal_records?.length || 0;

    return (
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => navigation.navigate("WorkoutDetail", { workout: item })}
      >
        <Text style={styles.workoutTitle}>{item.name}</Text>
        <Text style={styles.workoutDate}>{formatDate(item.date_performed)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItemWithIcon}>
            <Ionicons name="time-outline" size={20} color={colors.textLight} style={styles.statIcon} />
            <Text style={styles.statText}>{duration}m</Text>
          </View>
          <View style={styles.statItemWithIcon}>
            <Ionicons name="barbell-outline" size={20} color={colors.textLight} style={styles.statIcon} />
            <Text style={styles.statText}>{volume} lb</Text>
          </View>
          <View style={styles.statItemWithIcon}>
            <Ionicons name="trophy-outline" size={20} color={colors.textLight} style={styles.statIcon} />
            <Text style={styles.statText}>{prs} PRs</Text>
          </View>
        </View>

        <View style={styles.exerciseList}>
          {item.exercises && item.exercises.map((exercise, index) => {
            const sets = exercise.sets?.length || 0;
            const bestSet = exercise.sets?.reduce((best, current) => 
              (current.weight > best.weight) ? current : best
            , exercise.sets[0]);
            
            return (
              <View key={index} style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>
                    {sets} × {exercise.name}
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 40 }} /> {/* Empty view for spacing */}
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity>
          <Text style={styles.headerAction}>Calendar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.workout_id || item.id)}
        renderItem={renderWorkoutCard}
        contentContainerStyle={{ paddingVertical: Spacing.m }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default WorkoutHistory;
