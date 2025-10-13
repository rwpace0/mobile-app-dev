import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import exercisesAPI from "../../API/exercisesAPI";
import { createStyles } from "../../styles/exerciseDetail.styles";
import * as FileSystem from "expo-file-system/legacy";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import BottomSheetModal from "../../components/modals/bottomModal";
import DeleteConfirmModal from "../../components/modals/DeleteConfirmModal";
import { useWeight } from "../../utils/useWeight";
import statisticsAPI from "../../API/statisticsAPI";
import LineChart from "../../components/charts/LineChart";
import ChartContainer from "../../components/charts/ChartContainer";
import ChartPeriodSelector from "../../components/charts/ChartPeriodSelector";
import { format, parseISO } from "date-fns";

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
  const [progressPeriod, setProgressPeriod] = useState("3m");
  const [progressData, setProgressData] = useState(null);
  const [personalRecord, setPersonalRecord] = useState(null);

  // Cleanup function to clear exercise-specific cache on unmount
  useEffect(() => {
    return () => {
      const exerciseId = route.params.exerciseId;
      exercisesAPI.clearExerciseCache(exerciseId);
    };
  }, [route.params.exerciseId]);

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
        await fetchProgressData(exerciseId, progressPeriod);
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        setError(error.message || "Failed to load exercise");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [route.params.exerciseId, progressPeriod]
  );

  const fetchProgressData = useCallback(async (exerciseId, period) => {
    try {
      const [progression, pr] = await Promise.all([
        statisticsAPI.getExerciseProgression(exerciseId, period),
        statisticsAPI.getExercisePR(exerciseId),
      ]);

      setProgressData(progression);
      setPersonalRecord(pr);
    } catch (error) {
      console.error("[ExerciseDetail] Error fetching progress data:", error);
    }
  }, []);

  const handleProgressPeriodChange = useCallback(
    (period) => {
      setProgressPeriod(period);
      if (exercise) {
        fetchProgressData(exercise.exercise_id, period);
      }
    },
    [exercise, fetchProgressData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

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

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionLabel}>Instructions</Text>
        <Text style={styles.instructionText}>
          {exercise?.instruction || "No instructions available"}
        </Text>
      </View>
    </ScrollView>
  );

  const renderProgressTab = () => {
    const formatXLabel = (dateStr) => {
      try {
        const date = parseISO(dateStr);
        return format(date, "MMM d");
      } catch {
        return "";
      }
    };

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Personal Record Card */}
        {personalRecord && (
          <View style={styles.prCard}>
            <Text style={styles.prTitle}>Personal Record</Text>
            <View style={styles.prStats}>
              <View style={styles.prStatItem}>
                <Text style={styles.prValue}>
                  {weight.format(personalRecord.maxWeight)}
                </Text>
                <Text style={styles.prLabel}>Max Weight</Text>
              </View>
              <View style={styles.prStatItem}>
                <Text style={styles.prValue}>{personalRecord.repsAtMax}</Text>
                <Text style={styles.prLabel}>Reps</Text>
              </View>
              <View style={styles.prStatItem}>
                <Text style={styles.prDate}>
                  {format(parseISO(personalRecord.date), "MMM d, yyyy")}
                </Text>
                <Text style={styles.prLabel}>Date</Text>
              </View>
            </View>
          </View>
        )}

        {/* Period Selector */}
        <View style={styles.periodSelectorContainer}>
          <ChartPeriodSelector
            selectedPeriod={progressPeriod}
            onPeriodChange={handleProgressPeriodChange}
          />
        </View>

        {/* Weight Progression Chart */}
        <ChartContainer
          title="Weight Progression"
          subtitle="Maximum weight lifted per workout"
        >
          {progressData && progressData.length > 0 ? (
            <LineChart
              data={progressData}
              yAccessor="weight"
              xAccessor="date"
              color={colors.primaryBlue}
              period={progressPeriod}
            />
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>
                No progression data available
              </Text>
            </View>
          )}
        </ChartContainer>
      </ScrollView>
    );
  };

  const renderHistoryTab = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {history && history.length > 0 ? (
        history.map((workout) => (
          <View key={workout.workout_exercises_id} style={styles.workoutCard}>
            <Text style={styles.workoutTitle}>
              {workout.name || "Unnamed Workout"}
            </Text>
            <Text style={styles.workoutDate}>
              {workout.date_performed
                ? format(
                    new Date(workout.date_performed),
                    "MMM d, yyyy • h:mm a"
                  )
                : format(new Date(workout.created_at), "MMM d, yyyy • h:mm a")}
            </Text>

            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={[styles.setsHeaderText, { width: 50 }]}>SET</Text>
                <Text style={[styles.setsHeaderText, { flex: 1 }]}>
                  WEIGHT × REPS
                </Text>
                {/* Add RIR column if available */}
                <Text style={[styles.setsHeaderText, { width: 60 }]}>RIR</Text>
              </View>

              {workout.sets && workout.sets.length > 0 ? (
                workout.sets.map((set, index) => (
                  <View key={set.set_id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{set.set_order}</Text>
                    <Text style={styles.setInfo}>
                      {weight.formatSet(set.weight, set.reps)} reps
                    </Text>
                    <Text style={styles.setRir}>
                      {set.rir !== null && set.rir !== undefined
                        ? `${set.rir} RIR`
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
            onPress={() => fetchData()}
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
            onPress={() => setActiveTab(tab)}
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
    </SafeAreaView>
  );
};

export default ExerciseDetailPage;
