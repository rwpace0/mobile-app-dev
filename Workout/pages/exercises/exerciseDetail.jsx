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

      <View style={styles.infoCard}>
        <Ionicons
          name="fitness-outline"
          size={24}
          color={colors.textSecondary}
          style={styles.infoIcon}
        />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Muscle Group</Text>
          <Text style={styles.infoText}>
            {exercise?.muscle_group
              ? exercise.muscle_group.charAt(0).toUpperCase() +
                exercise.muscle_group.slice(1)
              : "Not specified"}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons
          name="barbell-outline"
          size={24}
          color={colors.textSecondary}
          style={styles.infoIcon}
        />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Equipment</Text>
          <Text style={styles.infoText}>
            {exercise?.equipment || "No equipment required"}
          </Text>
        </View>
      </View>

      {exercise?.secondary_muscle_groups &&
        exercise.secondary_muscle_groups.length > 0 && (
          <View style={styles.infoCard}>
            <Ionicons
              name="body-outline"
              size={24}
              color={colors.textSecondary}
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Secondary Muscle Groups</Text>
              <Text style={styles.infoText}>
                {exercise.secondary_muscle_groups
                  .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                  .join(", ")}
              </Text>
            </View>
          </View>
        )}

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionLabel}>Instructions</Text>
        <Text style={styles.instructionText}>
          {exercise?.instruction || "No instructions available"}
        </Text>
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
                  Overall
                </Text>
              </TouchableOpacity>
            </View>

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
                workout.sets.map((set, setIndex) => (
                  <View
                    key={set.set_id}
                    style={[
                      styles.setRow,
                      setIndex % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
                    ]}
                  >
                    <Text style={styles.setNumber}>{set.set_order}</Text>
                    <Text style={styles.setInfo}>
                      {weight.formatSet(set.weight, set.reps)} reps
                    </Text>
                    <Text style={styles.setRir}>
                      {set.rir !== null && set.rir !== undefined
                        ? `${set.rir}`
                        : "-"}
                    </Text>
                  </View>
                ))
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
