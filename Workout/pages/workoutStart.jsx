import React, { useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";
import styles from "../styles/start.styles";
import templateAPI from "../API/templateAPI";
import exercisesAPI from "../API/exercisesAPI";
import Header from "../components/header";

const WorkoutStartPage = () => {
  const navigation = useNavigation();
  const [workoutActive, setWorkoutActive] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTemplates = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const data = await templateAPI.getTemplates();
      
      // Fetch exercise details for each template
      const templatesWithExercises = await Promise.all(
        data.map(async (template) => {
          try {
            // Filter out null exercises and ensure no duplicates by exercise_id
            const uniqueExercises = template.exercises.filter(ex => ex && ex.exercise_id);
            const exerciseMap = new Map();
            uniqueExercises.forEach(ex => {
              if (!exerciseMap.has(ex.exercise_id)) {
                exerciseMap.set(ex.exercise_id, ex);
              }
            });
            
            const exercisesWithDetails = await Promise.all(
              Array.from(exerciseMap.values()).map(async (exercise) => {
                try {
                  const details = await exercisesAPI.getExerciseById(exercise.exercise_id);
                  return {
                    ...exercise,
                    name: details.name || "Unknown Exercise",
                    muscle_group: details.muscle_group || ""
                  };
                } catch (err) {
                  console.error(`Failed to fetch exercise ${exercise.exercise_id}:`, err);
                  return {
                    ...exercise,
                    name: "Unknown Exercise",
                    muscle_group: ""
                  };
                }
              })
            );
            
            // Sort exercises by their original order
            exercisesWithDetails.sort((a, b) => a.exercise_order - b.exercise_order);
            
            return {
              ...template,
              exercises: exercisesWithDetails
            };
          } catch (err) {
            console.error(`Failed to process template ${template.template_id}:`, err);
            return template;
          }
        })
      );
      
      setTemplates(templatesWithExercises);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load templates when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
      return () => {
        // Clear template cache when leaving the screen
        templateAPI.cache.clearPattern('^templates:');
      };
    }, [fetchTemplates])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates(false);
  }, [fetchTemplates]);

  const handleStartEmptyWorkout = useCallback(() => {
    setWorkoutActive(true);
    navigation.navigate("WorkoutActive");
  }, [navigation]);

  const handleNewRoutine = useCallback(() => {
    navigation.navigate("RoutineCreate");
  }, [navigation]);

  const handleExplore = () => {
    console.log("Explore");
  };
  

  const handleStartRoutine = useCallback((template) => {
    // Transform template exercises into the format expected by WorkoutActive
    const selectedExercises = template.exercises.map(exercise => ({
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      sets: Array(exercise.sets || 1).fill().map((_, idx) => ({
        id: (idx + 1).toString(),
        weight: "",
        reps: "",
        rir: "",
        completed: false
      }))
    }));

    // Navigate to WorkoutActive with the exercises
    navigation.navigate("WorkoutActive", {
      selectedExercises,
      workoutName: template.name
    });
  }, [navigation]);

  const renderTemplateList = useCallback(() => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <ActivityIndicator color={colors.primaryBlue} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchTemplates()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!templates || templates.length === 0) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>
            No routines created yet. Create a new routine to get started.
          </Text>
        </View>
      );
    }

    return templates.map((template) => (
      <View key={template.template_id} style={styles.templateContainer}>
        <View style={styles.templateHeader}>
          <Text style={styles.templateName}>{template.name}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.templateExercises}>
          {template.exercises.map(ex => ex.name).join(" • ")}
        </Text>
        <TouchableOpacity
          style={styles.startRoutineButton}
          onPress={() => handleStartRoutine(template)}
        >
          <Text style={styles.startRoutineText}>Start Routine</Text>
        </TouchableOpacity>
      </View>
    ));
  }, [loading, refreshing, error, templates, handleStartRoutine, fetchTemplates]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Workout" />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Quick Start Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <TouchableOpacity
            style={styles.startEmptyWorkoutButton}
            onPress={handleStartEmptyWorkout}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
            <Text style={styles.startEmptyWorkoutText}>
              Start Empty Workout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Routines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routines</Text>
            <TouchableOpacity>
              <Ionicons
                name="grid-outline"
                size={22}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* New Routine and Explore Buttons */}
          <View style={styles.routineActionButtons}>
            <TouchableOpacity
              style={styles.routineActionButton}
              onPress={handleNewRoutine}
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={colors.textLight}
              />
              <Text style={styles.routineActionText}>New Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.routineActionButton}
              onPress={handleExplore}
            >
              <Ionicons
                name="search-outline"
                size={22}
                color={colors.textLight}
              />
              <Text style={styles.routineActionText}>Explore</Text>
            </TouchableOpacity>
          </View>

          {/* Templates List */}
          {renderTemplateList()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutStartPage;
