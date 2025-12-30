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
import { createStyles } from "../../styles/display.styles";
import exercisesAPI from "../../API/exercisesAPI";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { mediaCache } from "../../API/local/MediaCache";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import FilterModal from "../../components/modals/FilterModal";

const muscleOptions = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Abs",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Calves",
  "Forearms",
];

const equipmentOptions = [
  "Dumbbell",
  "Cable",
  "Machine",
  "Barbell",
  "Bodyweight",
  "Kettlebell",
  "Resistance Band",
  "Other",
];

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
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const loadExercises = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const exercisesData = await exercisesAPI.getExercises();
      const sortedData = (exercisesData || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setExercises(sortedData);
      setFilteredExercises(sortedData);

      // Download media for exercises that have media_url but no local_media_path
      if (exercisesData && exercisesData.length > 0) {
        const exercisesNeedingMedia = exercisesData.filter(
          (ex) => ex.media_url && !ex.local_media_path
        );

        if (exercisesNeedingMedia.length > 0) {
          console.log(
            `[ViewExercises] Found ${exercisesNeedingMedia.length} exercises needing media download`
          );

          // Download media in the background for better performance
          setTimeout(async () => {
            for (const exercise of exercisesNeedingMedia) {
              try {
                await exercisesAPI.downloadExerciseMedia(
                  exercise.exercise_id,
                  exercise.media_url
                );
                console.log(
                  `[ViewExercises] Downloaded media for exercise ${exercise.exercise_id}`
                );
              } catch (mediaError) {
                console.warn(
                  `[ViewExercises] Failed to download media for exercise ${exercise.exercise_id}:`,
                  mediaError
                );
              }
            }

            // Refresh the exercises list to show the updated local_media_path
            const updatedExercises = await exercisesAPI.getExercises();
            if (updatedExercises) {
              const sortedUpdatedData = updatedExercises.sort((a, b) =>
                a.name.localeCompare(b.name)
              );
              setExercises(sortedUpdatedData);
              setFilteredExercises(sortedUpdatedData);
            }
          }, 1000); // Delay to avoid blocking the UI
        }
      }
    } catch (err) {
      console.error("Error loading exercises:", err);
      setError(err.message || "Failed to load exercises");
    } finally {
      if (showLoading) setLoading(false);
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

  // search and filter function that properly filters results
  useEffect(() => {
    let filtered = exercises;

    // Apply search filter
    if (searchText.trim()) {
      const searchTermLower = searchText.toLowerCase();
      filtered = filtered.filter((exercise) => {
        const nameMatch = exercise.name
          ?.toLowerCase()
          .includes(searchTermLower);
        const muscleGroupMatch = exercise.muscle_group
          ?.toLowerCase()
          .includes(searchTermLower);
        const instructionMatch = exercise.instruction
          ?.toLowerCase()
          .includes(searchTermLower);

        // Check if any secondary muscle group matches
        const secondaryMuscleMatch =
          exercise.secondary_muscle_groups &&
          Array.isArray(exercise.secondary_muscle_groups) &&
          exercise.secondary_muscle_groups.some((muscle) =>
            muscle?.toLowerCase().includes(searchTermLower)
          );

        return (
          nameMatch ||
          muscleGroupMatch ||
          instructionMatch ||
          secondaryMuscleMatch
        );
      });
    }

    // Apply muscle group filter
    if (selectedMuscleGroup) {
      filtered = filtered.filter(
        (exercise) =>
          exercise.muscle_group?.toLowerCase() === selectedMuscleGroup.toLowerCase()
      );
    }

    // Apply equipment filter
    if (selectedEquipment) {
      filtered = filtered.filter(
        (exercise) =>
          exercise.equipment?.toLowerCase() === selectedEquipment.toLowerCase()
      );
    }

    setFilteredExercises(
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    );
  }, [searchText, exercises, selectedMuscleGroup, selectedEquipment]);

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
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedMuscleGroup && styles.filterButtonActive,
          ]}
          onPress={() => setShowMuscleGroupModal(true)}
        >
          <Text
            style={[
              styles.filterText,
              selectedMuscleGroup && styles.filterTextActive,
            ]}
          >
            {selectedMuscleGroup
              ? selectedMuscleGroup.charAt(0).toUpperCase() +
                selectedMuscleGroup.slice(1)
              : "Any Body Part"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedEquipment && styles.filterButtonActive,
          ]}
          onPress={() => setShowEquipmentModal(true)}
        >
          <Text
            style={[
              styles.filterText,
              selectedEquipment && styles.filterTextActive,
            ]}
          >
            {selectedEquipment
              ? selectedEquipment.charAt(0).toUpperCase() +
                selectedEquipment.slice(1)
              : "Any Category"}
          </Text>
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={showMuscleGroupModal}
        onClose={() => setShowMuscleGroupModal(false)}
        title="Select Body Part"
        options={muscleOptions}
        selectedValue={selectedMuscleGroup}
        onSelect={(value) => setSelectedMuscleGroup(value)}
      />

      <FilterModal
        visible={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        title="Select Category"
        options={equipmentOptions}
        selectedValue={selectedEquipment}
        onSelect={(value) => setSelectedEquipment(value)}
      />

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
          // Performance optimizations
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={null} // Will be added if we have fixed height items
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
