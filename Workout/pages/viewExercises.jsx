import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { createStyles } from "../styles/display.styles";
import exercisesAPI from "../API/exercisesAPI";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { mediaCache } from "../API/local/MediaCache";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import Header from "../components/header";

// highlight matching text in search results
const HighlightText = ({ text, highlight, style, highlightStyle }) => {
  if (!highlight.trim()) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={index} style={[style, highlightStyle]}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

const ExerciseItem = React.memo(({ item, onPress, searchText }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [imageError, setImageError] = useState(false);

  const imagePath = item.local_media_path
    ? `${FileSystem.cacheDirectory}app_media/exercises/${item.local_media_path}`
    : null;

  return (
    <TouchableOpacity style={styles.exerciseItem} onPress={() => onPress(item)}>
      <View style={styles.exerciseRow}>
        <View style={styles.exerciseIconContainer}>
          {imagePath && !imageError ? (
            <Image
              source={{ uri: `file://${imagePath}` }}
              style={styles.exerciseImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name="barbell" size={28} color={colors.textPrimary} />
          )}
        </View>
        <View style={styles.exerciseDetails}>
          <HighlightText
            text={item.name}
            highlight={searchText}
            style={styles.exerciseName}
            highlightStyle={styles.highlightedText}
          />
          <Text style={styles.exerciseMuscleGroup}>
            {item.muscle_group.charAt(0).toUpperCase() +
              item.muscle_group.slice(1)}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
});

const ViewExercisesPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
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
      const sortedData = (data || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setExercises(sortedData);
      setFilteredExercises(sortedData);
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

  const handleExercisePress = useCallback(
    (exercise) => {
      navigation.navigate("ExerciseDetail", {
        exerciseId: exercise.exercise_id,
      });
    },
    [navigation]
  );

  const renderExerciseItem = useCallback(
    ({ item }) => {
      return (
        <ExerciseItem
          item={item}
          onPress={handleExercisePress}
          searchText={searchText}
        />
      );
    },
    [handleExercisePress, searchText]
  );

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
      setFilteredExercises(
        filtered.sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      setFilteredExercises(
        [...exercises].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  }, [searchText, exercises]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
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
      <Header
        title="Exercises"
        leftComponent={{
          type: "back",
          onPress: () => navigation.goBack(),
        }}
        rightComponent={{
          type: "button",
          text: "Create",
          onPress: () => navigation.navigate("CreateExercise"),
        }}
      />

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={22}
            color={colors.textFaded}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises"
            placeholderTextColor={colors.textFaded}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons
                name="close-circle"
                size={22}
                color={colors.textFaded}
              />
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
                {searchText
                  ? "No matching exercises found"
                  : "No exercises available"}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default ViewExercisesPage;
