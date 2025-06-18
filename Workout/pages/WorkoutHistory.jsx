import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import workoutAPI from "../API/workoutAPI";
import Header from "../components/header";
import styles from "../styles/workoutHistory.styles";
import colors from "../constants/colors";

const WorkoutHistoryPage = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleWorkouts, setVisibleWorkouts] = useState([]);

  const fetchWorkouts = async (nextCursor = null, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
      } else if (!nextCursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await workoutAPI.getWorkoutsCursor({
        cursor: nextCursor,
        limit: 20
      });

      if (shouldRefresh || !nextCursor) {
        setWorkouts(response.workouts);
      } else {
        setWorkouts(prev => [...prev, ...response.workouts]);
      }
      
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Failed to fetch workouts:", err);
      setError("Failed to load workout history. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setCursor(null);
    fetchWorkouts(null, true);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchWorkouts(cursor);
  }, [hasMore, loadingMore, cursor]);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const visibleWorkouts = viewableItems.map(item => item.item);
    setVisibleWorkouts(visibleWorkouts);

    // Update scroll direction and trigger smart prefetch
    if (viewableItems.length > 0) {
      const firstVisible = viewableItems[0].index;
      const lastKnownFirst = visibleWorkouts[0]?.workout_id;
      const direction = !lastKnownFirst || firstVisible >= workouts.findIndex(w => w.workout_id === lastKnownFirst)
        ? 'down'
        : 'up';
      
      workoutAPI.updateScrollDirection(direction);
      workoutAPI.triggerSmartPrefetch(visibleWorkouts, workouts);
    }
  }, [workouts]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
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

  const renderWorkoutCard = ({ item: workout }) => {
    const duration = Math.round((workout.duration || 0) / 60);
    const volume = workout.totalVolume || 0;

    return (
      <TouchableOpacity
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
            <Text style={styles.statText}>{volume} kg</Text>
          </View>
        </View>

        <View style={styles.exerciseList}>
          {(workout.exercises || []).map((exercise, index) => {
            // Find the heaviest set for this exercise
            const sets = exercise.sets || [];
            const bestSet = sets.length > 0 
              ? sets.reduce((best, current) => {
                  return (!best || current.weight > best.weight) ? current : best;
                }, sets[0])
              : null;
            
            return (
              <View key={index} style={styles.exerciseRow}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>
                    {sets.length} × {exercise.name || 'Unknown Exercise'}
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

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primaryLight} />
      </View>
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
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerAction}>Calendar</Text>
        </TouchableOpacity>
      </View>
      
      

      <FlatList
        data={workouts}
        renderItem={renderWorkoutCard}
        keyExtractor={item => item.workout_id}
        contentContainerStyle={{ paddingVertical: 16 }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>
              {error || "No workouts found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default WorkoutHistoryPage;
