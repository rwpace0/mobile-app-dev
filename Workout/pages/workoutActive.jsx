import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import styles from "../styles/active.styles";
import ActiveExerciseComponent from "../components/activeExercise";

const WorkoutActivePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [exercises, setExercises] = useState([]);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // Handle receiving new exercises from DisplayPage
    if (route.params?.selectedExercises) {
      setExercises(prev => [...prev, ...route.params.selectedExercises]);
      // Clear the params to prevent re-adding on re-render
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [route.params?.selectedExercises]);

  // Start timer when page loads
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutDuration((prev) => prev + 1);
    }, 1000);
    setTimer(interval);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  const handleAddExercise = () => {
    navigation.navigate('Display', {
      returnTo: 'WorkoutActivePage',});
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const handleDiscard = () => {
    // Reset workout state
    setExercises([]);
    setTotalVolume(0);
    setTotalSets(0);
    setWorkoutDuration(0);
  };

  const handleFinish = () => {
    // In a real app, save workout data and navigate to summary
    console.log("Finish workout");
  };

  // Update total volume and sets when exercises change
  const updateTotals = (exerciseId, volume, sets) => {
    setTotalVolume(prev => prev + volume);
    setTotalSets(prev => prev + sets);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Workout</Text>
        <TouchableOpacity onPress={handleFinish}>
          <Text style={styles.finishButton}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>
              {formatDuration(workoutDuration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{totalVolume} kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>
        </View>

        {exercises.length === 0 ? (
          <View style={styles.emptyWorkoutContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="barbell-outline" size={42} color="#BBBBBB" />
            </View>
            <Text style={styles.getStartedText}>Get started</Text>
            <Text style={styles.instructionText}>
              Add an exercise to start your workout
            </Text>

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.exercisesContainer}>
            {exercises.map((exercise) => (
              <ActiveExerciseComponent
                key={exercise.id}
                exercise={exercise}
                onUpdateTotals={updateTotals}
                onRemoveExercise={() => handleRemoveExercise(exercise.id)}
              />
            ))}

            <TouchableOpacity
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WorkoutActivePage;
