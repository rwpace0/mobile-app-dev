import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/active.styles";

const WorkoutActivePage = () => {
  const navigation = useNavigation();

  const handleAddExercise = () => {
    console.log("Add exercise");
    // navigation.navigate("ExercisesPage");
  };

  const handleDiscard = () => {
    console.log("Discard workout");
    // navigation.navigate("WorkoutStartPage");
  };

  const handleFinish = () => {
    console.log("Finish workout");
    // navigation.navigate("WorkoutSummaryPage");
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
            <Text style={styles.statValue}>4s</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>0 kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Sets</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        <View style={styles.emptyWorkoutContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="barbell-outline" size={42} color="#BBBBBB" />
          </View>
          <Text style={styles.getStartedText}>Get started</Text>
          <Text style={styles.instructionText}>Add an exercise to start your workout</Text>
          
          <TouchableOpacity 
            style={styles.addExerciseButton}
            onPress={handleAddExercise}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => console.log("Settings")}
        >
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.discardButton}
          onPress={handleDiscard}
        >
          <Text style={styles.discardText}>Discard Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default WorkoutActivePage;