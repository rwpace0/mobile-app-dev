import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/start.styles";
import SlideUpWorkout from "../animations/slideUp"; 
import colors from "../constants/colors";

const WorkoutStartPage = () => {
  const navigation = useNavigation();
  const [workoutActive, setWorkoutActive] = useState(false);

  const handleStartEmptyWorkout = () => {
    console.log("Starting empty workout");
    setWorkoutActive(true);
  };

  const handleCloseWorkout = () => {
    setWorkoutActive(false);
  };

  const handleNewRoutine = () => {
    console.log("Create new routine");
    // navigation.navigate("NewRoutinePage");
  };

  const handleExplore = () => {
    console.log("Explore routines");
    // navigation.navigate("ExploreRoutinesPage");
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
            <Text style={styles.startEmptyWorkoutText}>Start Empty Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Routines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routines</Text>
            <TouchableOpacity>
              <Ionicons name="grid-outline" size={22} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* New Routine and Explore Buttons */}
          <View style={styles.routineActionButtons}>
            <TouchableOpacity 
              style={styles.routineActionButton}
              onPress={handleNewRoutine}
            >
              <Ionicons name="document-text-outline" size={22} color={colors.textLight} />
              <Text style={styles.routineActionText}>New Routine</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.routineActionButton}
              onPress={handleExplore}
            >
              <Ionicons name="search-outline" size={22} color={colors.textLight} />
              <Text style={styles.routineActionText}>Explore</Text>
            </TouchableOpacity>
          </View>

          {/* Message: no routines yet */}
          <View style={styles.emptyRoutinesContainer}>
            <Text style={styles.emptyRoutinesText}>
              No routines created yet. Create a new routine to get started.
            </Text>
          </View>
        </View>
      </ScrollView>

      
    </SafeAreaView>
  );
};

export default WorkoutStartPage;