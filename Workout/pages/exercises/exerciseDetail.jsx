import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import exercisesAPI from "../../API/exercisesAPI";
import { createStyles } from "../../styles/exerciseDetail.styles";
import * as FileSystem from "expo-file-system/legacy";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import BottomSheetModal from "../../components/modals/bottomModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import { useWeight } from "../../utils/useWeight";
import statisticsAPI from "../../API/statisticsAPI";
import MultiLineChart from "../../components/charts/MultiLineChart";
import { format, parseISO } from "date-fns";
import { hapticLight, hapticSelection } from "../../utils/hapticFeedback";

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: "1m", label: "Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "Year" },
];

const ExerciseDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const [activeTab, setActiveTab] = useState("Summary");
  const [exercise, setExercise] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBottomModal, setShowBottomModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Progress tab state
  const [dateRange, setDateRange] = useState("1m");
  const [metric, setMetric] = useState("weight"); // "weight", "reps", "volume"
  const [chartData, setChartData] = useState([]);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Track if component is mounted to prevent memory leaks
  const isMountedRef = useRef(true);

  // Cleanup function to clear exercise-specific cache on unmount
  useEffect(() => {
    return () => {
      const exerciseId = route.params.exerciseId;
      exercisesAPI.clearExerciseCache(exerciseId);
    };
  }, [route.params.exerciseId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clear all state to free memory
      setChartData([]);
      setShowBreakdown(false);
      setShowDateRangeModal(false);
    };
  }, []);

  // Aggressive cleanup on blur/unmount to prevent memory leaks
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      if (exercise) {
        fetchProgressData(exercise.exercise_id, dateRange, metric);
      }

      return () => {
        isMountedRef.current = false;
        // Null out data first to help GC, then set to empty
        setChartData([]);
        setShowBreakdown(false);
        setShowDateRangeModal(false);
      };
    }, [exercise, dateRange, metric, fetchProgressData])
  );

  const fetchData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const exerciseId = route.params.exerciseId;
        const exerciseData = await exercisesAPI.getExerciseById(exerciseId);

        if (!exerciseData) {
          setError("Exercise not found");
          return;
        }

        setExercise(exerciseData);

        // Download exercise media if it exists on server but not locally
        if (exerciseData.media_url && !exerciseData.local_media_path) {
          try {
            console.log("[ExerciseDetail] Downloading exercise media...");
            await exercisesAPI.downloadExerciseMedia(
              exerciseData.exercise_id,
              exerciseData.media_url
            );

            // Refresh the exercise data to get the updated local_media_path
            const updatedExercise = await exercisesAPI.getExerciseById(
              exerciseId
            );
            if (updatedExercise) {
              setExercise(updatedExercise);
            }
          } catch (mediaError) {
            console.warn(
              "[ExerciseDetail] Failed to download exercise media:",
              mediaError
            );
            // Don't fail the entire page load for media download issues
          }
        }

        // Fetch workout history for this exercise
        const historyData = await exercisesAPI.getExerciseHistory(exerciseId);
        setHistory(historyData || []);

        // Fetch progress data for Progress tab
        await fetchProgressData(exerciseId, dateRange, metric);
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        setError(error.message || "Failed to load exercise");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [route.params.exerciseId, dateRange, metric]
  );

  const fetchProgressData = useCallback(
    async (exerciseId, period, metricType) => {
      try {
        const data = await statisticsAPI.getExerciseBestMetricPerWorkout(
          exerciseId,
          period,
          metricType
        );

        // Only update state if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        // Validate and sanitize data
        const validatedData = Array.isArray(data) ? data : [];
        setChartData(validatedData);
      } catch (error) {
        console.error("[ExerciseDetail] Error fetching progress data:", error);
        if (isMountedRef.current) {
          setChartData([]);
        }
      }
    },
    []
  );

  const handleDateRangeChange = useCallback((value) => {
    hapticLight();
    setDateRange(value);
    setShowDateRangeModal(false);
  }, []);

  // Reset breakdown visibility when filters change
  useEffect(() => {
    setShowBreakdown(false);
  }, [dateRange, metric]);

  const handleMetricChange = useCallback((newMetric) => {
    hapticLight();
    setMetric(newMetric);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  const handleToggleBreakdown = useCallback(() => {
    hapticLight();
    setShowBreakdown((prev) => !prev);
  }, []);

  // Get selected option label
  const selectedDateRangeLabel =
    DATE_RANGE_OPTIONS.find((opt) => opt.value === dateRange)?.label || "Month";

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
    const dateRangeLower = selectedDateRangeLabel?.toLowerCase() || "month";
    let metricLabel;
    if (metric === "weight") {
      metricLabel = "heaviest weight";
    } else if (metric === "reps") {
      metricLabel = "highest reps";
    } else if (metric === "volume") {
      metricLabel = "best performance";
    } else {
      metricLabel = "heaviest weight";
    }
    return `${
      metricLabel.charAt(0).toUpperCase() + metricLabel.slice(1)
    } per workout over the last ${dateRangeLower}`;
  }, [selectedDateRangeLabel, metric]);

  // Format date for breakdown display
  const formatBreakdownDate = useCallback((dateStr) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  }, []);

  // Prepare lines config for MultiLineChart (single line for value)
  const lines = useMemo(() => {
    return [
      {
        key: "value",
        color: colors.primaryBlue,
        enabled: true,
      },
    ];
  }, [colors.primaryBlue]);

  // Memoize breakdown rows
  const breakdownRows = useMemo(() => {
    // Only calculate when breakdown is visible to save memory
    if (!showBreakdown) return [];
    if (!chartData || chartData.length === 0) return [];

    // Limit processing to prevent memory issues (max 100 rows)
    const maxRows = 100;
    const dataToProcess = chartData.slice(-maxRows);

    // Process data and reverse to show most recent first
    const processedRows = [];

    for (let i = dataToProcess.length - 1; i >= 0; i--) {
      const item = dataToProcess[i];
      const value = Number(item.value) || 0;

      // Only add row if there's data
      if (value > 0) {
        const row = {
          date: item.date,
          value: value,
          isAlt: processedRows.length % 2 === 1,
        };
        // Include weight, reps, and rir for volume metric
        if (
          metric === "volume" &&
          item.weight !== undefined &&
          item.reps !== undefined
        ) {
          row.weight = Number(item.weight) || 0;
          row.reps = Number(item.reps) || 0;
          row.rir =
            item.rir !== null && item.rir !== undefined
              ? Number(item.rir)
              : null;
        }
        processedRows.push(row);
      }
    }

    return processedRows;
  }, [showBreakdown, chartData, metric]);

  // Format breakdown value based on metric
  const formatBreakdownValue = useCallback(
    (value, rowData = null) => {
      if (metric === "weight") {
        return weight.format(value);
      } else if (metric === "reps") {
        return `${Math.round(value)} reps`;
      } else if (metric === "volume") {
        // Display as weight × reps @ rir format (or just weight × reps if no rir)
        if (
          rowData &&
          rowData.weight !== undefined &&
          rowData.reps !== undefined
        ) {
          const weightReps = `${weight.format(rowData.weight)} × ${Math.round(
            rowData.reps
          )}`;
          // Add RIR if available
          if (rowData.rir !== null && rowData.rir !== undefined) {
            return `${weightReps} @ ${Math.round(rowData.rir)}`;
          }
          return weightReps;
        }
        // Fallback to calculated volume if weight/reps not available
        return Math.round(value).toLocaleString();
      }
      return value.toString();
    },
    [metric, weight]
  );

  // Get breakdown header label based on metric
  const breakdownHeaderLabel = useMemo(() => {
    if (metric === "weight") {
      return "Heaviest Weight";
    } else if (metric === "reps") {
      return "Highest Reps";
    } else if (metric === "volume") {
      return "Best Performance";
    }
    return "Best Weight";
  }, [metric]);

  // Render function for breakdown rows
  const renderBreakdownRow = useCallback(
    ({ item: row, index }) => (
      <View style={[styles.breakdownRow, row.isAlt && styles.breakdownRowAlt]}>
        <Text style={styles.breakdownDateText}>
          {formatBreakdownDate(row.date)}
        </Text>
        <Text style={styles.breakdownWeightText}>
          {formatBreakdownValue(row.value, row)}
        </Text>
      </View>
    ),
    [formatBreakdownDate, formatBreakdownValue, styles]
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

  // Create actions for bottom sheet modal
  const dateRangeActions = DATE_RANGE_OPTIONS.map((option) => ({
    title: option.label,
    onPress: () => handleDateRangeChange(option.value),
    icon: dateRange === option.value ? "checkmark" : null,
  }));

  const handleMenuPress = () => {
    setShowBottomModal(true);
  };

  const handleEdit = () => {
    setShowBottomModal(false);
    navigation.navigate("CreateExercise", {
      exerciseId: exercise.exercise_id,
      exercise: exercise,
      isEditing: true,
    });
  };

  const handleDelete = () => {
    setShowBottomModal(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await exercisesAPI.deleteExercise(exercise.exercise_id);
      navigation.goBack(); // Go back to the previous screen after deletion
    } catch (error) {
      console.error("Failed to delete exercise:", error);
      // You might want to show an error message to the user here
    }
  };

  // Check if exercise is public (handle different data types)
  const isPublicExercise =
    exercise?.is_public === true ||
    exercise?.is_public === 1 ||
    exercise?.is_public === "true" ||
    exercise?.is_public === "1";

  const actions = isPublicExercise
    ? []
    : [
        {
          title: "Edit Exercise",
          icon: "create-outline",
          onPress: handleEdit,
        },
        {
          title: "Delete Exercise",
          icon: "trash-outline",
          onPress: handleDelete,
          destructive: true,
        },
      ];

  const renderSummaryTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {exercise?.local_media_path && (
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: `file://${FileSystem.cacheDirectory}app_media/exercises/${exercise.local_media_path}`,
            }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.summaryContent}>
        <Text style={styles.summaryTitle}>{exercise?.name || "Exercise"}</Text>

        {exercise?.muscle_group && (
          <View style={styles.muscleGroupSection}>
            <Text style={styles.muscleGroupLabel}>Primary</Text>
            <Text style={styles.muscleGroupText}>
              {exercise.muscle_group.charAt(0).toUpperCase() +
                exercise.muscle_group.slice(1)}
            </Text>
          </View>
        )}

        {exercise?.secondary_muscle_groups &&
          exercise.secondary_muscle_groups.length > 0 && (
            <View style={styles.muscleGroupSection}>
              <Text style={styles.muscleGroupLabel}>Secondary</Text>
              <Text style={styles.muscleGroupText}>
                {exercise.secondary_muscle_groups
                  .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                  .join(", ")}
              </Text>
            </View>
          )}

        {exercise?.instruction && (
          <View style={styles.instructionSection}>
            <Text style={styles.muscleGroupLabel}>Instructions</Text>
            <Text style={styles.instructionText}>{exercise.instruction}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderProgressTab = () => {
    return (
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
        {/* Selection Button */}
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
        </View>

        {/* Chart and Breakdown */}
        {chartData.length > 0 ? (
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

            {/* Metric Selector Buttons */}
            <View style={styles.metricButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  metric === "volume" && styles.metricButtonActive,
                ]}
                onPress={() => handleMetricChange("volume")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    metric === "volume" && styles.metricButtonTextActive,
                  ]}
                >
                  Performance
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  metric === "weight" && styles.metricButtonActive,
                ]}
                onPress={() => handleMetricChange("weight")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    metric === "weight" && styles.metricButtonTextActive,
                  ]}
                >
                  Weight
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  metric === "reps" && styles.metricButtonActive,
                ]}
                onPress={() => handleMetricChange("reps")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    metric === "reps" && styles.metricButtonTextActive,
                  ]}
                >
                  Reps
                </Text>
              </TouchableOpacity>
            </View>

            {/* Records Rows */}
            {exerciseRecords && (
              <View style={styles.recordsContainer}>
                {/* Heaviest Weight */}
                {exerciseRecords.heaviestWeight && (
                  <View style={styles.recordRow}>
                    <Text style={styles.recordRowLabel}>Heaviest Weight</Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleRecordPress(
                          exerciseRecords.heaviestWeight.workout_id
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recordRowValue}>
                        {weight.format(exerciseRecords.heaviestWeight.weight)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Best Performance */}
                {exerciseRecords.bestPerformance && (
                  <View style={styles.recordRow}>
                    <Text style={styles.recordRowLabel}>Best Performance</Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleRecordPress(
                          exerciseRecords.bestPerformance.workout_id
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.recordRowValue}>
                        {weight.formatSet(
                          exerciseRecords.bestPerformance.weight,
                          exerciseRecords.bestPerformance.reps
                        )}
                        {exerciseRecords.bestPerformance.rir !== null &&
                        exerciseRecords.bestPerformance.rir !== undefined
                          ? ` @ ${exerciseRecords.bestPerformance.rir}`
                          : ""}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

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
                  <Text style={styles.breakdownHeaderText}>Workout</Text>
                  <Text style={styles.breakdownHeaderText}>
                    {breakdownHeaderLabel}
                  </Text>
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
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="stats-chart-outline"
              size={80}
              color={colors.textSecondary}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptyMessage}>
              Start tracking workouts with this exercise to see progression.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Memoize PR calculation for the exercise
  const exercisePR = useMemo(() => {
    if (!history || history.length === 0) return null;

    let bestPerformance = 0;
    let bestWorkoutId = null;
    let bestSetIds = new Set();

    // First pass: find the best performance value
    history.forEach((workout) => {
      if (workout.sets && workout.sets.length > 0) {
        workout.sets.forEach((set) => {
          const performance =
            (set.weight || 0) *
            (set.reps || 0) *
            (set.rir !== null && set.rir !== undefined ? set.rir : 1);

          if (performance > bestPerformance) {
            bestPerformance = performance;
          }
        });
      }
    });

    // Second pass: find the most recent workout (first in history array) that achieved this performance
    // and collect all set IDs in that workout that match the PR
    for (const workout of history) {
      if (workout.sets && workout.sets.length > 0) {
        const workoutHasPR = workout.sets.some((set) => {
          const performance =
            (set.weight || 0) *
            (set.reps || 0) *
            (set.rir !== null && set.rir !== undefined ? set.rir : 1);
          return performance === bestPerformance;
        });

        if (workoutHasPR) {
          bestWorkoutId = workout.workout_exercises_id;
          // Collect all set IDs in this workout that match the PR
          workout.sets.forEach((set) => {
            const performance =
              (set.weight || 0) *
              (set.reps || 0) *
              (set.rir !== null && set.rir !== undefined ? set.rir : 1);
            if (performance === bestPerformance) {
              bestSetIds.add(set.set_id);
            }
          });
          break; // Stop at the most recent workout with PR
        }
      }
    }

    return {
      performance: bestPerformance,
      workoutId: bestWorkoutId,
      setIds: bestSetIds,
    };
  }, [history]);

  // Memoize heaviest weight and best performance records for navigation
  const exerciseRecords = useMemo(() => {
    if (!history || history.length === 0) return null;

    let heaviestWeight = 0;
    let heaviestWeightSet = null;
    let bestPerformance = 0;
    let bestPerformanceSet = null;

    history.forEach((workout) => {
      if (workout.sets && workout.sets.length > 0) {
        workout.sets.forEach((set) => {
          const setWeight = set.weight || 0;
          const performance =
            (set.weight || 0) *
            (set.reps || 0) *
            (set.rir !== null && set.rir !== undefined ? set.rir : 1);

          // Track heaviest weight
          if (setWeight > heaviestWeight) {
            heaviestWeight = setWeight;
            heaviestWeightSet = {
              weight: set.weight,
              reps: set.reps,
              rir: set.rir,
              workout_id: workout.workout_id,
              set_id: set.set_id,
              workout_name: workout.name,
              date: workout.date_performed || workout.created_at,
            };
          }

          // Track best performance
          if (performance > bestPerformance) {
            bestPerformance = performance;
            bestPerformanceSet = {
              weight: set.weight,
              reps: set.reps,
              rir: set.rir,
              workout_id: workout.workout_id,
              set_id: set.set_id,
              workout_name: workout.name,
              date: workout.date_performed || workout.created_at,
            };
          }
        });
      }
    });

    return {
      heaviestWeight: heaviestWeightSet,
      bestPerformance: bestPerformanceSet,
    };
  }, [history]);

  // Handler to navigate to workout detail for a specific record
  const handleRecordPress = useCallback(
    (workoutId) => {
      if (workoutId) {
        hapticLight();
        navigation.navigate("WorkoutDetail", { workout_id: workoutId });
      }
    },
    [navigation]
  );

  const renderHistoryTab = () => (
    <ScrollView
      style={styles.historyContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {history && history.length > 0 ? (
        history.map((workout, workoutIndex) => (
          <View
            key={workout.workout_exercises_id}
            style={styles.workoutContainer}
          >
            <Text style={styles.workoutTitle}>
              {workout.name || "Unnamed Workout"}
            </Text>
            <Text style={styles.workoutDate}>
              {workout.date_performed
                ? format(
                    new Date(workout.date_performed),
                    "h:mm a, EEEE, MMM d, yyyy"
                  )
                : format(
                    new Date(workout.created_at),
                    "h:mm a, EEEE, MMM d, yyyy"
                  )}
            </Text>

            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={[styles.setsHeaderText, styles.setHeaderColumn]}>
                  SET
                </Text>
                <Text
                  style={[
                    styles.setsHeaderText,
                    { flex: 1, marginLeft: Spacing.m },
                  ]}
                >
                  WEIGHT × REPS
                </Text>
                {/* Add RIR column if available */}
                <Text style={[styles.setsHeaderText, styles.rirHeaderColumn]}>
                  RIR
                </Text>
              </View>

              {workout.sets && workout.sets.length > 0 ? (
                workout.sets.map((set, setIndex) => {
                  // Calculate performance indicators by comparing with previous workout
                  const prevWorkout = history[workoutIndex + 1];
                  const prevSet = prevWorkout?.sets?.[setIndex];

                  let indicators = [];

                  if (prevSet) {
                    // Calculate weight difference
                    const weightDiff =
                      (set.weight || 0) - (prevSet.weight || 0);
                    // Only show if difference is significant (≥ 0.5 in current unit)
                    if (Math.abs(weightDiff) >= 0.5) {
                      const formattedWeight = weight.format(
                        Math.abs(weightDiff)
                      );
                      indicators.push({
                        text: `${weightDiff > 0 ? "+" : "-"}${formattedWeight}`,
                        isIncrease: weightDiff > 0,
                      });
                    }

                    // Calculate reps difference
                    const repsDiff = (set.reps || 0) - (prevSet.reps || 0);
                    if (repsDiff !== 0) {
                      indicators.push({
                        text: `${repsDiff > 0 ? "+" : ""}${repsDiff} rep${
                          Math.abs(repsDiff) !== 1 ? "s" : ""
                        }`,
                        isIncrease: repsDiff > 0,
                      });
                    }
                  }

                  // Check if this set is a PR (only in the most recent workout that achieved the best performance)
                  const isPR =
                    exercisePR &&
                    workout.workout_exercises_id === exercisePR.workoutId &&
                    exercisePR.setIds.has(set.set_id);

                  return (
                    <View
                      key={set.set_id}
                      style={[
                        styles.setRow,
                        setIndex % 2 === 0
                          ? styles.setRowEven
                          : styles.setRowOdd,
                      ]}
                    >
                      <Text style={styles.setNumber}>{set.set_order}</Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <Text style={styles.setInfo}>
                          {weight.formatSet(set.weight, set.reps)} reps
                        </Text>
                        {indicators.map((indicator, idx) => (
                          <Text
                            key={idx}
                            style={[
                              styles.setIndicator,
                              indicator.isIncrease
                                ? styles.setIndicatorIncrease
                                : styles.setIndicatorDecrease,
                            ]}
                          >
                            {indicator.text}
                          </Text>
                        ))}
                        {isPR && (
                          <Ionicons
                            name="trophy"
                            size={16}
                            color={colors.accentGold}
                            style={styles.prIcon}
                          />
                        )}
                      </View>
                      <Text style={styles.setRir}>
                        {set.rir !== null && set.rir !== undefined
                          ? `${set.rir}`
                          : "-"}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyHistoryText}>No sets recorded</Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>No history available</Text>
        </View>
      )}
    </ScrollView>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              hapticLight();
              fetchData();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={exercise?.name || "Exercise"}
        leftComponent={{ type: "back" }}
        rightComponent={
          isPublicExercise
            ? null
            : {
                type: "icon",
                icon: "ellipsis-horizontal",
                onPress: handleMenuPress,
              }
        }
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["Summary", "Progress", "History"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => {
              hapticSelection();
              setActiveTab(tab);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "Summary"
        ? renderSummaryTab()
        : activeTab === "Progress"
        ? renderProgressTab()
        : renderHistoryTab()}

      <BottomSheetModal
        visible={showBottomModal}
        onClose={() => setShowBottomModal(false)}
        title={exercise?.name}
        actions={actions}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={`Delete ${exercise?.name}?`}
      />

      {/* Bottom Sheet Modal for Progress Tab */}
      <BottomSheetModal
        visible={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        title="Select Date Range"
        actions={dateRangeActions}
      />
    </SafeAreaView>
  );
};

export default ExerciseDetailPage;
