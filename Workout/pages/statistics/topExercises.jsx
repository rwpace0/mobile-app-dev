import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { createStyles as createHistoryStyles } from "../../styles/workoutHistory.styles";
import { createStyles as createStatisticsStyles } from "../../styles/statistics.styles";
import Header from "../../components/static/header";
import statisticsAPI from "../../API/statisticsAPI";
import { hapticLight } from "../../utils/hapticFeedback";

const TopExercisesStatistics = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const historyStyles = createHistoryStyles(isDark);
  const statisticsStyles = createStatisticsStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState([]);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await statisticsAPI.getTopExercises("3m", 15);
      setExercises(data || []);
    } catch (error) {
      console.error("[Statistics] Error fetching top exercises:", error);
      setExercises([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const handleExercisePress = useCallback(
    (exerciseId) => {
      hapticLight();
      navigation.navigate("ExerciseDetail", { exerciseId });
    },
    [navigation]
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={historyStyles.container}>
        <Header title="Top Exercises" leftComponent={{ type: "back" }} />
        <View style={historyStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={historyStyles.container}>
      <Header title="Top Exercises" leftComponent={{ type: "back" }} />

      <ScrollView
        contentContainerStyle={statisticsStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <View style={statisticsStyles.sectionsGroup}>
          {exercises.length === 0 ? (
            <View style={statisticsStyles.emptyContainer}>
              <Text style={statisticsStyles.emptyTitle}>
                No exercises tracked yet
              </Text>
              <Text style={statisticsStyles.emptyMessage}>
                Complete some workouts to see your most frequently used
                exercises.
              </Text>
            </View>
          ) : (
            exercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.exerciseId}
                style={[
                  statisticsStyles.sectionItem,
                  index !== exercises.length - 1 &&
                    statisticsStyles.sectionItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => handleExercisePress(exercise.exerciseId)}
              >
                <View style={statisticsStyles.sectionLeft}>
                  <View style={statisticsStyles.sectionIcon}>
                    <Ionicons
                      name="barbell"
                      size={20}
                      color={colors.primaryBlue}
                    />
                  </View>
                  <View>
                    <Text style={statisticsStyles.sectionTitle}>
                      {exercise.name}
                    </Text>
                    {exercise.muscleGroup ? (
                      <Text style={statisticsStyles.exerciseMuscle}>
                        {exercise.muscleGroup}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={statisticsStyles.exerciseVolume}>
                    {exercise.totalSets} sets
                  </Text>
                  <Text style={statisticsStyles.exerciseCount}>
                    {exercise.workoutCount}{" "}
                    {exercise.workoutCount === 1 ? "workout" : "workouts"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TopExercisesStatistics;

