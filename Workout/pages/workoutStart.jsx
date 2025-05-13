import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/start.styles";

const WorkoutStartPage = () => {
  const navigation = useNavigation();

  const handleStartEmptyWorkout = () => {
    console.log("Starting empty workout");
    // Will navigate to workout page later when implemented
    // navigation.navigate("WorkoutPage");
  };

  const handleNewRoutine = () => {
    console.log("Create new routine");
    // Will navigate to routine creation page later when implemented
    // navigation.navigate("NewRoutinePage");
  };

  const handleExplore = () => {
    console.log("Explore routines");
    // Will navigate to explore page later when implemented
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
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.startEmptyWorkoutText}>Start Empty Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Routines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routines</Text>
            <TouchableOpacity>
              <Ionicons name="grid-outline" size={22} color="#BBBBBB" />
            </TouchableOpacity>
          </View>

          {/* New Routine and Explore Buttons */}
          <View style={styles.routineActionButtons}>
            <TouchableOpacity 
              style={styles.routineActionButton}
              onPress={handleNewRoutine}
            >
              <Ionicons name="document-text-outline" size={22} color="#BBBBBB" />
              <Text style={styles.routineActionText}>New Routine</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.routineActionButton}
              onPress={handleExplore}
            >
              <Ionicons name="search-outline" size={22} color="#BBBBBB" />
              <Text style={styles.routineActionText}>Explore</Text>
            </TouchableOpacity>
          </View>

          {/* Message indicating no routines yet */}
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