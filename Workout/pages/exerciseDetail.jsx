import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getExerciseById, getExerciseHistory } from "../API/exercisesAPI";
import styles from "../styles/exerciseDetail.styles";
import { format } from "date-fns";

const ExerciseDetailPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState("Summary");
  const [exercise, setExercise] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [exerciseData, historyData] = await Promise.all([
        getExerciseById(route.params.exerciseId),
        getExerciseHistory(route.params.exerciseId)
      ]);
      
      setExercise(exerciseData);
      setHistory(historyData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const renderSummaryTab = () => (
    <View style={styles.content}>
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionLabel}>Instructions</Text>
        <Text style={styles.instructionText}>
          {exercise?.instruction || "No instructions available"}
        </Text>
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.content}>
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
              </View>

              {/* Sets */}
              {workout.sets && workout.sets.length > 0 ? (
                workout.sets.map((set, index) => (
                  <View key={set.set_id} style={styles.setRow}>
                    <Text style={styles.setNumber}>Set {set.set_order}</Text>
                    <Text style={styles.setInfo}>
                      {set.weight}kg × {set.reps} reps
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#47A3FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise?.name || "Exercise"}</Text>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
};

export default ExerciseDetailPage; 