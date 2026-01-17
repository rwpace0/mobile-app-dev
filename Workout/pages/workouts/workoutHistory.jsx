import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import workoutAPI from "../../API/workoutAPI";
import Header from "../../components/static/header";
import { createStyles } from "../../styles/workoutHistory.styles";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import { useWeight } from "../../utils/useWeight";
import { format, parseISO } from "date-fns";
import { hapticLight } from "../../utils/hapticFeedback";

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

const WorkoutHistoryPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleWorkouts, setVisibleWorkouts] = useState([]);

  const fetchWorkouts = useCallback(
    async (nextCursor = null, shouldRefresh = false) => {
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
          limit: 20,
        });

        if (shouldRefresh || !nextCursor) {
          setWorkouts(response.workouts);
        } else {
          setWorkouts((prev) => [...prev, ...response.workouts]);
        }

        setCursor(response.nextCursor);
        setHasMore(response.hasMore);
      } catch (err) {
        console.error("Failed to fetch workouts:", err);
        setError(err.message || "Failed to load workout history");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const onRefresh = useCallback(() => {
    setCursor(null);
    fetchWorkouts(null, true);
  }, [fetchWorkouts]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    fetchWorkouts(cursor);
  }, [hasMore, loadingMore, cursor, fetchWorkouts]);

  // Load workouts when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
      return () => {
        // Clear workout cache when leaving the screen
        workoutAPI.cache.clearPattern("^workouts:");
      };
    }, [fetchWorkouts])
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }) => {
      const newVisibleWorkouts = viewableItems.map((item) => item.item);
      setVisibleWorkouts(newVisibleWorkouts);

      // Update scroll direction and trigger smart prefetch
      if (viewableItems.length > 0) {
        const firstVisible = viewableItems[0].index;
        const lastKnownFirst = visibleWorkouts[0]?.workout_id;
        const direction =
          !lastKnownFirst ||
          firstVisible >=
            workouts.findIndex((w) => w.workout_id === lastKnownFirst)
            ? "down"
            : "up";

        workoutAPI.updateScrollDirection(direction);
        workoutAPI.triggerSmartPrefetch(newVisibleWorkouts, workouts);
      }
    },
    [workouts, visibleWorkouts]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  };

  const renderWorkoutCard = useCallback(
    ({ item: workout }) => {
      const totalSets = (workout.exercises || []).reduce((total, exercise) => {
        return total + (exercise.sets?.length || 0);
      }, 0);
      const totalExercises = workout.exercises?.length || 0;

      return (
        <TouchableOpacity
          style={styles.workoutCard}
          onPress={() =>
            navigation.navigate("WorkoutDetail", {
              workout_id: workout.workout_id,
            })
          }
        >
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>{workout.name || "Workout"}</Text>
            <Text style={styles.workoutDate}>
              {formatDate(workout.date_performed)}
            </Text>
            <View style={styles.statsRow}>
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
                  <Ionicons
                    name="barbell"
                    size={20}
                    color={colors.textPrimary}
                  />
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

          <View style={styles.exerciseListContainer}>
            <View style={styles.setsHeader}>
              <Text style={[styles.setsHeaderText, styles.setHeaderColumn]}>
                #
              </Text>
              <Text
                style={[
                  styles.setsHeaderText,
                  { flex: 1, marginLeft: Spacing.m },
                ]}
              >
                EXERCISE
              </Text>
              <Text style={[styles.setsHeaderText, styles.bestSetColumn]}>
                BEST SET
              </Text>
            </View>
            {(workout.exercises || []).map((exercise, index) => {
              const sets = exercise.sets || [];
              const bestSet =
                sets.length > 0
                  ? sets.reduce((best, current) => {
                      return !best || current.weight > best.weight
                        ? current
                        : best;
                    }, sets[0])
                  : null;

              return (
                <TouchableOpacity
                  key={exercise.workout_exercises_id || index}
                  style={[
                    styles.exerciseRow,
                    index % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
                  ]}
                  onPress={() =>
                    navigation.navigate("ExerciseDetail", {
                      exerciseId: exercise.exercise_id,
                    })
                  }
                >
                  <Text style={styles.setNumber}>{index + 1}</Text>
                  <Text style={styles.exerciseName}>
                    {exercise.name || "Unknown Exercise"}
                  </Text>
                  <Text style={styles.bestSet}>
                    {bestSet
                      ? weight.formatSet(bestSet.weight, bestSet.reps)
                      : "-"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, styles, colors, weight]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primaryLight} />
      </View>
    );
  }, [loadingMore]);

  const handleCalendarPress = useCallback(() => {
    hapticLight();
    navigation.navigate("Calendar");
  }, [navigation]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="History"
          rightComponent={{
            type: "icon",
            icon: "calendar-outline",
            onPress: handleCalendarPress,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="History"
        rightComponent={{
          type: "icon",
          icon: "calendar-outline",
          onPress: handleCalendarPress,
        }}
      />

      <FlatList
        data={workouts}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.workout_id}
        contentContainerStyle={{ paddingTop: Spacing.xs, paddingBottom: Spacing.m }}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={renderFooter}
        // Performance optimizations
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={3}
        windowSize={8}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <View style={styles.loadingContainer}>
            <Text style={styles.errorText}>{error || "No workouts found"}</Text>
            {error && (
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                hapticLight();
                onRefresh();
              }}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default WorkoutHistoryPage;
