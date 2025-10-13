import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { createStyles } from "../../styles/statistics.styles";
import Header from "../../components/static/header";
import ChartContainer from "../../components/charts/ChartContainer";
import ViewModeToggle from "../../components/charts/ViewModeToggle";
import MetricSelector from "../../components/charts/MetricSelector";
import BarChart from "../../components/charts/BarChart";
import statisticsAPI from "../../API/statisticsAPI";

const StatisticsPage = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [selectedMetric, setSelectedMetric] = useState("workouts");
  const [viewMode, setViewMode] = useState("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [overviewStats, setOverviewStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topExercises, setTopExercises] = useState([]);

  // Fetch chart data based on selected metric and view mode
  const fetchChartData = useCallback(async (metric, mode) => {
    try {
      let data = [];

      if (metric === "workouts") {
        data =
          mode === "week"
            ? await statisticsAPI.getWorkoutCountsWeekly()
            : await statisticsAPI.getWorkoutCountsMonthly();
      } else if (metric === "duration") {
        data =
          mode === "week"
            ? await statisticsAPI.getDurationWeekly()
            : await statisticsAPI.getDurationMonthly();
      } else if (metric === "sets") {
        data =
          mode === "week"
            ? await statisticsAPI.getSetsWeekly()
            : await statisticsAPI.getSetsMonthly();
      }

      // Ensure all numeric values are valid
      const sanitizedData = (data || []).map((item) => {
        const sanitized = { ...item };
        // Ensure all numeric fields are actual numbers
        Object.keys(sanitized).forEach((key) => {
          if (key !== "date" && typeof sanitized[key] !== "string") {
            const num = Number(sanitized[key]);
            sanitized[key] = isNaN(num) ? 0 : num;
          }
        });
        return sanitized;
      });

      return sanitizedData;
    } catch (error) {
      console.error("[Statistics] Error fetching chart data:", error);
      return [];
    }
  }, []);

  const fetchAllData = useCallback(
    async (metric, mode, showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        // Fetch overview stats for past 8 weeks and top exercises
        const [overview, exercises, data] = await Promise.all([
          statisticsAPI.getOverviewStats("3m"), // Past 3 months for overview
          statisticsAPI.getTopExercises("3m", 5),
          fetchChartData(metric, mode),
        ]);

        setOverviewStats(
          overview || { totalWorkouts: 0, avgDuration: 0, totalSets: 0 }
        );
        setTopExercises(exercises || []);
        setChartData(data);
      } catch (error) {
        console.error("[Statistics] Error fetching data:", error);
        setOverviewStats({ totalWorkouts: 0, avgDuration: 0, totalSets: 0 });
        setTopExercises([]);
        setChartData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchChartData]
  );

  useFocusEffect(
    useCallback(() => {
      fetchAllData(selectedMetric, viewMode);
    }, [selectedMetric, viewMode, fetchAllData])
  );

  const handleMetricChange = useCallback(
    (metric) => {
      setSelectedMetric(metric);
      fetchAllData(metric, viewMode, false);
    },
    [viewMode, fetchAllData]
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
      fetchAllData(selectedMetric, mode, false);
    },
    [selectedMetric, fetchAllData]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData(selectedMetric, viewMode, false);
  }, [selectedMetric, viewMode, fetchAllData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Statistics" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Check if we have any data at all
  const hasData = overviewStats && overviewStats.totalWorkouts > 0;

  // Get the proper accessor and subtitle based on selected metric
  const getChartConfig = () => {
    switch (selectedMetric) {
      case "workouts":
        return {
          yAccessor: "count",
          subtitle: `Number of workouts per ${viewMode}`,
        };
      case "duration":
        return {
          yAccessor: "duration",
          subtitle: `Average workout duration per ${viewMode} (minutes)`,
        };
      case "sets":
        return {
          yAccessor: "sets",
          subtitle: `Total sets performed per ${viewMode}`,
        };
      default:
        return {
          yAccessor: "count",
          subtitle: `Number of workouts per ${viewMode}`,
        };
    }
  };

  const chartConfig = getChartConfig();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Statistics" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        {!hasData ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="stats-chart-outline"
              size={80}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Statistics Yet</Text>
            <Text style={styles.emptyMessage}>
              Start tracking your workouts to see your progress and statistics
              here.
            </Text>
          </View>
        ) : (
          <>
            {/* Overview Stats */}
            <View style={styles.overviewCard}>
              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statItem,
                    styles.statItemBorderRight,
                    styles.statItemBorderBottom,
                  ]}
                >
                  <Text style={styles.statValue}>
                    {overviewStats?.totalWorkouts || 0}
                  </Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
                <View style={[styles.statItem, styles.statItemBorderBottom]}>
                  <Text style={styles.statValue}>
                    {overviewStats?.avgDuration || 0}m
                  </Text>
                  <Text style={styles.statLabel}>Avg Duration</Text>
                </View>
                <View style={[styles.statItem, styles.statItemBorderRight]}>
                  <Text style={styles.statValue}>
                    {overviewStats?.totalSets || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total Sets</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{topExercises.length}</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
              </View>
            </View>

            {/* Unified Chart Section */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>
                  {selectedMetric.charAt(0).toUpperCase() +
                    selectedMetric.slice(1)}
                </Text>
                <ViewModeToggle
                  selectedMode={viewMode}
                  onModeChange={handleViewModeChange}
                />
              </View>

              <View style={styles.chartWrapper}>
                {chartData.length > 0 ? (
                  <BarChart
                    data={chartData}
                    yAccessor={chartConfig.yAccessor}
                    xAccessor="date"
                    color={colors.primaryBlue}
                    period={viewMode}
                  />
                ) : (
                  <View style={styles.emptyChartContainer}>
                    <Text style={styles.emptyMessage}>
                      No {selectedMetric} data available
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.metricSelectorContainer}>
                <MetricSelector
                  selectedMetric={selectedMetric}
                  onMetricChange={handleMetricChange}
                />
              </View>
            </View>

            {/* Top Exercises */}
            <ChartContainer
              title="Top Exercises"
              subtitle="Most frequently performed exercises"
            >
              {topExercises.length > 0 ? (
                <View style={styles.exerciseList}>
                  {topExercises.map((exercise, index) => (
                    <View
                      key={exercise.exerciseId}
                      style={[
                        styles.exerciseItem,
                        index === topExercises.length - 1 &&
                          styles.exerciseItemLast,
                      ]}
                    >
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseMuscle}>
                          {exercise.muscleGroup || "Unknown"} •{" "}
                          {exercise.totalSets} sets
                        </Text>
                      </View>
                      <View style={styles.exerciseStats}>
                        <Text style={styles.exerciseVolume}>
                          {exercise.workoutCount} workouts
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyMessage}>
                    No exercise data available
                  </Text>
                </View>
              )}
            </ChartContainer>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatisticsPage;
