import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";
import styles from "../styles/start.styles";
import { templateAPI } from "../API/templateAPI";

const WorkoutStartPage = () => {
  const navigation = useNavigation();
  const [workoutActive, setWorkoutActive] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateAPI.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEmptyWorkout = () => {
    console.log("Starting empty workout");
    setWorkoutActive(true);
    navigation.navigate("WorkoutActive");
  };

  const handleCloseWorkout = () => {
    setWorkoutActive(false);
  };

  const handleNewRoutine = () => {
    console.log("Create new routine");
    navigation.navigate("RoutineCreate");
  };

  const handleExplore = () => {
    console.log("Explore routines");
    // navigation.navigate("ExploreRoutinesPage");
  };

  const handleStartRoutine = (template) => {
    // Transform template exercises into the format expected by WorkoutActive
    const selectedExercises = template.exercises.map(exercise => {
      // Create empty sets array based on the template's set count
      const emptySets = Array(exercise.sets).fill().map((_, idx) => ({
        id: (idx + 1).toString(),
        weight: "",
        reps: "",
        total: "",
        completed: false
      }));

      return {
        exercise_id: exercise.exercise_id,
        name: exercise.name,
        sets: emptySets
      };
    });

    // Navigate to WorkoutActive with the exercises
    navigation.navigate("WorkoutActive", {
      selectedExercises,
      workoutName: template.name
    });
  };

  const renderTemplateList = () => {
    if (loading) {
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
          {template.exercises.map(ex => ex.name).join(", ")}
        </Text>
        <TouchableOpacity
          style={styles.startRoutineButton}
          onPress={() => handleStartRoutine(template)}
        >
          <Text style={styles.startRoutineText}>Start Routine</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
      </View>

      <ScrollView style={styles.content}>
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
