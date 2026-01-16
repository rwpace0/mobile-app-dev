import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
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
  { value: "day", label: "Workout" },
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
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // Fetch data from API
  const fetchData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading && isMountedRef.current) {
          setLoading(true);
        }

        const data = await statisticsAPI.getSetsPerMuscleGroup(
          dateRange,
          timePeriod
        );

        // Only update state if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        // Memory safety checks - warn in development
        if (__DEV__) {
          const dataSize = data.length;
          const estimatedMemory = dataSize * 12 * 50; // Rough estimate: points * muscle groups * bytes

          if (dataSize > 100) {
            console.warn(
              `[WeeklySets] Large dataset detected: ${dataSize} data points. ` +
                `This may cause memory issues. Consider using a shorter time period.`
            );
          }

          if (estimatedMemory > 50000) {
            console.warn(
              `[WeeklySets] Estimated memory usage: ~${Math.round(
                estimatedMemory / 1024
              )}KB. ` + `Consider optimizing data size.`
            );
          }
        }

        // Validate and sanitize data
        const validatedData = Array.isArray(data) ? data : [];
        setChartData(validatedData);

        // Extract unique muscle groups from data and calculate totals
        const muscleGroupsMap = new Map();

        validatedData.forEach((item) => {
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

        // Warn if too many muscle groups
        if (__DEV__ && muscleGroupsArray.length > 15) {
          console.warn(
            `[WeeklySets] ${muscleGroupsArray.length} muscle groups detected. ` +
              `This may impact chart performance.`
          );
        }

        if (isMountedRef.current) {
          setMuscleGroups(muscleGroupsArray);
        }
      } catch (error) {
        console.error("[WeeklySets] Error fetching data:", error);
        if (isMountedRef.current) {
          setChartData([]);
          setMuscleGroups([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [dateRange, timePeriod, colors.primaryBlue]
  );

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      fetchData();

      // Aggressive cleanup on blur/unmount to prevent memory leaks
      return () => {
        isMountedRef.current = false;
        // Null out data first to help GC, then set to empty
        setChartData([]);
        setMuscleGroups([]);
        setShowBreakdown(false);
        setShowDateRangeModal(false);
        setShowTimePeriodModal(false);

        // Hint for garbage collection (if available)
        if (global.gc) {
          setTimeout(() => {
            try {
              global.gc();
            } catch (e) {
              // GC not available
            }
          }, 100);
        }
      };
    }, [fetchData])
  );

  // Reset breakdown visibility when filters change
  useEffect(() => {
    setShowBreakdown(false);
  }, [dateRange, timePeriod]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear all state to free memory
      setChartData([]);
      setMuscleGroups([]);
      setShowBreakdown(false);
      setShowDateRangeModal(false);
      setShowTimePeriodModal(false);
    };
  }, []);

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

  // Debounce ref for muscle group toggling
  const toggleDebounceRef = useRef(null);

  const toggleMuscleGroup = useCallback((index) => {
    hapticLight();

    // Clear any pending debounce
    if (toggleDebounceRef.current) {
      clearTimeout(toggleDebounceRef.current);
    }

    // Update immediately for UI responsiveness
    setMuscleGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return updated;
    });

    // Debounce breakdown recalculation for multiple rapid toggles
    toggleDebounceRef.current = setTimeout(() => {
      toggleDebounceRef.current = null;
    }, 100);
  }, []);

  const handleToggleBreakdown = useCallback(() => {
    hapticLight();
    setShowBreakdown((prev) => !prev);
  }, []);

  // Get selected option labels - must be defined before using them
  const selectedDateRangeLabel =
    DATE_RANGE_OPTIONS.find((opt) => opt.value === dateRange)?.label || "Month";
  const selectedTimePeriodLabel =
    TIME_PERIOD_OPTIONS.find((opt) => opt.value === timePeriod)?.label ||
    "Week";

  // Memoize date range label
  const dateRangeLabel = useMemo(() => {
    if (!chartData || chartData.length === 0) return "";
    try {
      const startDate = format(parseISO(chartData[0].date), "d MMM yyyy");
      const endDate = format(
        parseISO(chartData[chartData.length - 1].date),
        "d MMM yyyy"
      );
      return `${startDate} - ${endDate}`;
    } catch {
      return "";
    }
  }, [chartData]);

  // Memoize chart description text
  const chartDescription = useMemo(() => {
    const timePeriodLower = selectedTimePeriodLabel?.toLowerCase() || "week";
    const dateRangeLower = selectedDateRangeLabel?.toLowerCase() || "month";

    if (dateRange === "all") {
      return `Sets per ${timePeriodLower} (all time)`;
    }
    return `Sets per ${timePeriodLower} over the last ${dateRangeLower}`;
  }, [dateRange, selectedDateRangeLabel, selectedTimePeriodLabel]);

  // Format date for breakdown display - memoized function
  const formatBreakdownDate = useCallback((dateStr) => {
    try {
      return format(parseISO(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  }, []);

  // Prepare lines config for MultiLineChart - memoized to prevent re-renders
  const lines = useMemo(() => {
    return muscleGroups.map((mg) => ({
      key: mg.name,
      color: mg.color,
      enabled: mg.enabled,
    }));
  }, [muscleGroups]);

  // Memoize breakdown rows to prevent crash and memory issues
  const breakdownRows = useMemo(() => {
    // Only calculate when breakdown is visible to save memory
    if (!showBreakdown) return [];
    if (!chartData || chartData.length === 0) return [];

    // Warn if dataset is large
    if (__DEV__ && chartData.length > 52) {
      console.warn(
        `[WeeklySets] Breakdown calculation for ${chartData.length} rows. ` +
          `Limiting to 100 most recent rows for performance.`
      );
    }

    // Limit processing to prevent memory issues (max 100 rows)
    const maxRows = 100;
    const dataToProcess = chartData.slice(-maxRows);

    // Create a map of enabled muscle groups for quick lookup
    const enabledMuscleGroups = new Set(
      muscleGroups.filter((mg) => mg.enabled).map((mg) => mg.name)
    );

    // If no muscle groups enabled, return empty to save computation
    if (enabledMuscleGroups.size === 0) return [];

    // Process data and reverse to show most recent first
    const processedRows = [];

    for (let i = dataToProcess.length - 1; i >= 0; i--) {
      const item = dataToProcess[i];
      const muscleGroupsWithSets = [];

      // Extract muscle groups with sets (only if enabled)
      // Use Object.entries for better performance than for-in
      const entries = Object.entries(item);
      for (let j = 0; j < entries.length; j++) {
        const [key, value] = entries[j];
        if (
          key !== "date" &&
          Number(value) > 0 &&
          enabledMuscleGroups.has(key)
        ) {
          muscleGroupsWithSets.push({
            name: key,
            displayName: key.charAt(0).toUpperCase() + key.slice(1),
            sets: Number(value),
            color: MUSCLE_COLORS[key] || "#007AFF",
          });
        }
      }

      // Sort by sets descending only if there are items
      if (muscleGroupsWithSets.length > 1) {
        muscleGroupsWithSets.sort((a, b) => b.sets - a.sets);
      }

      // Add row
      processedRows.push({
        date: item.date,
        muscles: muscleGroupsWithSets,
        isAlt: processedRows.length % 2 === 1,
      });
    }

    return processedRows;
  }, [showBreakdown, chartData, muscleGroups]);

  // Render function for breakdown rows (virtualized)
  const renderBreakdownRow = useCallback(
    ({ item: row, index }) => (
      <View style={[styles.breakdownRow, row.isAlt && styles.breakdownRowAlt]}>
        <Text style={styles.breakdownDateText}>
          {formatBreakdownDate(row.date)}
        </Text>
        <View style={styles.breakdownMusclesContainer}>
          {row.muscles.length > 0 ? (
            row.muscles.map((mg, mgIndex) => (
              <View
                key={`${mg.name}-${mgIndex}`}
                style={styles.muscleBadgeWrapper}
              >
                <View
                  style={[
                    styles.muscleBadge,
                    {
                      backgroundColor: mg.color + "20",
                      borderColor: mg.color + "40",
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.muscleBadgeText, { color: mg.color }]}>
                    {mg.displayName}
                  </Text>
                  <Text style={[styles.muscleBadgeSets, { color: mg.color }]}>
                    {mg.sets}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.breakdownNoDataText}>No data</Text>
          )}
        </View>
      </View>
    ),
    [formatBreakdownDate, styles, colors]
  );

  // Optimized getItemLayout for FlatList
  const getBreakdownItemLayout = useCallback(
    (data, index) => ({
      length: 60, // Approximate row height
      offset: 60 * index,
      index,
    }),
    []
  );

  // Key extractor for FlatList
  const keyExtractor = useCallback(
    (item, index) => `${item.date}-${index}`,
    []
  );

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

        {/* Chart and Breakdown */}
        {chartData.length > 0 && (
          <>
            <Text style={styles.chartDescription}>{chartDescription}</Text>

            {/* Tappable Chart */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleToggleBreakdown}
            >
              <View style={styles.chartWrapper}>
                <MultiLineChart
                  data={chartData}
                  lines={lines}
                  xAccessor="date"
                  period={dateRange}
                  height={220}
                />
              </View>
              {dateRangeLabel && (
                <Text style={styles.chartDateRange}>{dateRangeLabel}</Text>
              )}
            </TouchableOpacity>

            {/* Breakdown - Only render when visible, using FlatList for virtualization */}
            {showBreakdown && breakdownRows.length > 0 && (
              <View style={styles.breakdownContainer}>
                {/* Header Row */}
                <View
                  style={[
                    styles.breakdownHeaderRow,
                    {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderColor,
                    },
                  ]}
                >
                  <Text style={styles.breakdownHeaderText}>
                    {selectedTimePeriodLabel}
                  </Text>
                  <Text style={styles.breakdownHeaderText}>Muscle Groups</Text>
                </View>

                {/* Data Rows - Virtualized with FlatList */}
                <FlatList
                  data={breakdownRows}
                  renderItem={renderBreakdownRow}
                  keyExtractor={keyExtractor}
                  getItemLayout={getBreakdownItemLayout}
                  maxToRenderPerBatch={10}
                  initialNumToRender={10}
                  windowSize={5}
                  removeClippedSubviews={true}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                />
              </View>
            )}
          </>
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
              Total Sets
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
