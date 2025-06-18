import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import styles from "../styles/display.styles";
import exercisesAPI from "../API/exercisesAPI";
import { Ionicons } from "@expo/vector-icons";

// highlight matching text in search results
const HighlightText = ({ text, highlight, style }) => {
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={index} style={[style, styles.highlightedText]}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

const ViewExercisesPage = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadExercises = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await exercisesAPI.getExercises();
      setExercises(data || []);
      setFilteredExercises(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load exercises:", err);
      setError(err.message || "Failed to load exercises");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load exercises when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadExercises(false);
  }, [loadExercises]);

  // search function that properly filters results
  useEffect(() => {
    if (searchText.trim()) {
      const searchTermLower = searchText.toLowerCase();
      const filtered = exercises.filter((exercise) => {
        const nameMatch = exercise.name
          ?.toLowerCase()
          .includes(searchTermLower);
        const muscleGroupMatch = exercise.muscle_group
          ?.toLowerCase()
          .includes(searchTermLower);
        const instructionMatch = exercise.instruction
          ?.toLowerCase()
          .includes(searchTermLower);

        return nameMatch || muscleGroupMatch || instructionMatch;
      });
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchText, exercises]);

  const handleExercisePress = useCallback((exercise) => {
    navigation.navigate("ExerciseDetail", {
      exerciseId: exercise.exercise_id,
    });
  }, [navigation]);

  const renderExerciseItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.exerciseItem}
        onPress={() => handleExercisePress(item)}
      >
        <View style={styles.exerciseRow}>
          <View style={styles.exerciseIconContainer}>
            <Ionicons name="fitness-outline" size={28} color="#BBBBBB" />
          </View>
          <View style={styles.exerciseDetails}>
            <HighlightText
              text={item.name}
              highlight={searchText}
              style={styles.exerciseName}
            />
            <Text style={styles.exerciseMuscleGroup}>
              {item.muscle_group.charAt(0).toUpperCase() +
                item.muscle_group.slice(1)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#777777" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#47A3FF" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadExercises()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateExercise")}
          >
            <Text style={styles.headerActionText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={22}
            color="#999999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises"
            placeholderTextColor="#999999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={22} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Any Body Part</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Any Category</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseListContainer}>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => String(item.exercise_id)}
          renderItem={renderExerciseItem}
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContentContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>
                {searchText ? "No matching exercises found" : "No exercises available"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default ViewExercisesPage;
