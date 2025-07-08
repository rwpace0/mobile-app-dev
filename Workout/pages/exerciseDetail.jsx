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
import exercisesAPI from "../API/exercisesAPI";
import { createStyles } from "../styles/exerciseDetail.styles";
import { format } from "date-fns";
import * as FileSystem from 'expo-file-system';
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import Header from "../components/header";
import BottomSheetModal from "../components/modals/bottomModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

const ExerciseDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [activeTab, setActiveTab] = useState("Summary");
  const [exercise, setExercise] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showBottomModal, setShowBottomModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cleanup function to clear exercise-specific cache on unmount
  useEffect(() => {
    return () => {
      const exerciseId = route.params.exerciseId;
      exercisesAPI.clearExerciseCache(exerciseId);
    };
  }, [route.params.exerciseId]);

  const fetchData = useCallback(async (showLoading = true) => {
    const exerciseId = route.params.exerciseId;
    if (showLoading) setLoading(true);
    
    try {
      const [exerciseData, historyData] = await Promise.all([
        exercisesAPI.getExerciseById(exerciseId),
        exercisesAPI.getExerciseHistory(exerciseId)
      ]);
      
      setExercise(exerciseData);
      setHistory(historyData || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching exercise data:", err);
      setError(err.message || "Failed to load exercise data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params.exerciseId]);

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
  const isPublicExercise = exercise?.is_public === true || exercise?.is_public === 1 || exercise?.is_public === "true" || exercise?.is_public === "1";

  const actions = isPublicExercise ? [] : [
    {
      title: 'Edit Exercise',
      icon: 'create-outline',
      onPress: handleEdit,
    },
    {
      title: 'Delete Exercise',
      icon: 'trash-outline',
      onPress: handleDelete,
      destructive: true,
    },
  ];

  const renderSummaryTab = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
    >
      {exercise?.local_media_path && (
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: `file://${FileSystem.cacheDirectory}app_media/exercises/${exercise.local_media_path}` 
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
              ? exercise.muscle_group.charAt(0).toUpperCase() + exercise.muscle_group.slice(1)
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

  const renderHistoryTab = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
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
                ? format(new Date(workout.date_performed), "MMM d, yyyy • h:mm a")
                : format(new Date(workout.created_at), "MMM d, yyyy • h:mm a")}
            </Text>

            <View style={styles.setsContainer}>
              <View style={styles.setsHeader}>
                <Text style={[styles.setsHeaderText, { width: 50 }]}>SET</Text>
                <Text style={[styles.setsHeaderText, { flex: 1 }]}>WEIGHT × REPS</Text>
                {/* Add RIR column if available */}
                <Text style={[styles.setsHeaderText, { width: 60 }]}>RIR</Text>
              </View>

              {workout.sets && workout.sets.length > 0 ? (
                workout.sets.map((set, index) => (
                  <View key={set.set_id} style={styles.setRow}>
                    <Text style={styles.setNumber}>Set {set.set_order}</Text>
                    <Text style={styles.setInfo}>
                      {set.weight}kg × {set.reps} reps
                    </Text>
                    <Text style={styles.setRir}>
                      {set.rir !== null && set.rir !== undefined ? `${set.rir} RIR` : '-'}
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
          isPublicExercise ? null : {
            type: 'icon',
            icon: 'ellipsis-horizontal',
            onPress: handleMenuPress,
          }
        }
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["Summary", "History"].map((tab) => (
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
      {activeTab === "Summary" ? renderSummaryTab() : renderHistoryTab()}

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