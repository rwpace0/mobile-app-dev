import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { createStyles } from "../../styles/statistics.styles";
import Header from "../../components/static/header";
import MultiLineChart from "../../components/charts/MultiLineChart";
import BottomSheetModal from "../../components/modals/bottomModal";
import statisticsAPI from "../../API/statisticsAPI";
import { hapticLight } from "../../utils/hapticFeedback";

// Muscle group color palette - Highly distinct colors
const MUSCLE_COLORS = {
  shoulders: "#007AFF", // Blue
  triceps: "#FFD700", // Gold/Yellow
  chest: "#AF52DE", // Purple
  traps: "#FF6347", // Tomato Red
  back: "#FF6347", // Tomato Red
  biceps: "#00CED1", // Dark Turquoise
  hamstrings: "#FF1493", // Deep Pink
  glutes: "#32CD32", // Lime Green
  quads: "#FF69B4", // Hot Pink
  abs: "#FF8C00", // Dark Orange
  calves: "#00FA9A", // Medium Spring Green
  forearms: "#9370DB", // Medium Purple
};

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: "1m", label: "Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "Year" },
  { value: "all", label: "All Time" },
];

// Time period options
const TIME_PERIOD_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const WeeklySetsStatistics = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [dateRange, setDateRange] = useState("1m");
  const [timePeriod, setTimePeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showTimePeriodModal, setShowTimePeriodModal] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const data = await statisticsAPI.getSetsPerMuscleGroup(
          dateRange,
          timePeriod
        );

        setChartData(data);

        // Extract unique muscle groups from data and calculate totals
        const muscleGroupsMap = new Map();

        data.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (key !== "date") {
              const current = muscleGroupsMap.get(key) || {
                total: 0,
                enabled: true,
              };
              muscleGroupsMap.set(key, {
                name: key,
                total: current.total + (Number(item[key]) || 0),
                enabled: current.enabled,
                color: MUSCLE_COLORS[key] || colors.primaryBlue,
              });
            }
          });
        });

        // Convert to array and sort by total (descending)
        const muscleGroupsArray = Array.from(muscleGroupsMap.values()).sort(
          (a, b) => b.total - a.total
        );

        setMuscleGroups(muscleGroupsArray);
      } catch (error) {
        console.error("[WeeklySets] Error fetching data:", error);
        setChartData([]);
        setMuscleGroups([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, timePeriod, colors.primaryBlue]
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const handleDateRangeChange = useCallback((value) => {
    hapticLight();
    setDateRange(value);
    setShowDateRangeModal(false);
  }, []);

  const handleTimePeriodChange = useCallback((value) => {
    hapticLight();
    setTimePeriod(value);
    setShowTimePeriodModal(false);
  }, []);

  const toggleMuscleGroup = useCallback((index) => {
    hapticLight();
    setMuscleGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return updated;
    });
  }, []);

  // Get date range label
  const getDateRangeLabel = () => {
    if (chartData.length === 0) return "";
    const startDate = format(parseISO(chartData[0].date), "d MMM yyyy");
    const endDate = format(
      parseISO(chartData[chartData.length - 1].date),
      "d MMM yyyy"
    );
    return `${startDate} - ${endDate}`;
  };

  // Prepare lines config for MultiLineChart
  const lines = muscleGroups.map((mg) => ({
    key: mg.name,
    color: mg.color,
    enabled: mg.enabled,
  }));

  // Get selected option labels
  const selectedDateRangeLabel =
    DATE_RANGE_OPTIONS.find((opt) => opt.value === dateRange)?.label || "Month";
  const selectedTimePeriodLabel =
    TIME_PERIOD_OPTIONS.find((opt) => opt.value === timePeriod)?.label ||
    "Week";

  // Create actions for bottom sheet modals
  const dateRangeActions = DATE_RANGE_OPTIONS.map((option) => ({
    title: option.label,
    onPress: () => handleDateRangeChange(option.value),
    icon: dateRange === option.value ? "checkmark" : null,
  }));

  const timePeriodActions = TIME_PERIOD_OPTIONS.map((option) => ({
    title: option.label,
    onPress: () => handleTimePeriodChange(option.value),
    icon: timePeriod === option.value ? "checkmark" : null,
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Set count per muscle" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Sets" leftComponent={{ type: "back" }} />

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
        {/* Selection Buttons */}
        <View style={styles.selectionButtonsContainer}>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => {
              hapticLight();
              setShowDateRangeModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.selectionButtonContent}>
              <Text style={styles.selectionButtonText}>
                {selectedDateRangeLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
                style={styles.selectionButtonChevron}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => {
              hapticLight();
              setShowTimePeriodModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.selectionButtonContent}>
              <Text style={styles.selectionButtonText}>
                {selectedTimePeriodLabel}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
                style={styles.selectionButtonChevron}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Chart Section */}
        <View style={styles.chartWrapper}>
          <MultiLineChart
            data={chartData}
            lines={lines}
            xAccessor="date"
            period={dateRange}
            height={220}
          />
        </View>

        {/* Date Range Label */}
        {chartData.length > 0 && (
          <Text style={styles.chartDateRange}>{getDateRangeLabel()}</Text>
        )}

        {/* Muscle Groups List */}
        <View style={styles.muscleGroupList}>
          <View
            style={[
              styles.muscleGroupItem,
              {
                borderBottomWidth: 1,
                borderBottomColor: colors.borderColor,
                paddingTop: Spacing.s,
              },
            ]}
          >
            <View style={styles.muscleGroupLeft}>
              <Text
                style={[
                  styles.muscleName,
                  { fontWeight: "500", color: colors.textSecondary },
                ]}
              >
                Muscle
              </Text>
            </View>
            <Text
              style={[
                styles.muscleCount,
                { fontWeight: "500", color: colors.textSecondary },
              ]}
            >
              {chartData.length > 0 ? getDateRangeLabel() : "Sets"}
            </Text>
          </View>

          {muscleGroups.map((muscle, index) => (
            <TouchableOpacity
              key={muscle.name}
              style={[
                styles.muscleGroupItem,
                index % 2 === 1 && styles.muscleGroupItemAlt,
              ]}
              onPress={() => toggleMuscleGroup(index)}
              activeOpacity={0.7}
            >
              <View style={styles.muscleGroupLeft}>
                <View
                  style={[
                    styles.muscleCheckbox,
                    { borderColor: muscle.color },
                    muscle.enabled && [
                      styles.muscleCheckboxChecked,
                      {
                        backgroundColor: muscle.color,
                      },
                    ],
                  ]}
                >
                  {muscle.enabled && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.textWhite}
                    />
                  )}
                </View>
                <Text style={styles.muscleName}>
                  {muscle.name.charAt(0).toUpperCase() + muscle.name.slice(1)}
                </Text>
              </View>
              <Text style={styles.muscleCount}>{muscle.total}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {muscleGroups.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="stats-chart-outline"
              size={80}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptyMessage}>
              Start tracking your workouts to see muscle group statistics.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sheet Modals */}
      <BottomSheetModal
        visible={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        title="Select Date Range"
        actions={dateRangeActions}
      />
      <BottomSheetModal
        visible={showTimePeriodModal}
        onClose={() => setShowTimePeriodModal(false)}
        title="Select Time Period"
        actions={timePeriodActions}
      />
    </SafeAreaView>
  );
};

export default WeeklySetsStatistics;
