import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import exercisesAPI from "../API/exercisesAPI";
import { Ionicons } from "@expo/vector-icons";
import Header from "./header";
import * as FileSystem from "expo-file-system";
import { getColors } from "../constants/colors";
import { Spacing } from "../constants/theme";
import { useTheme } from "../state/SettingsContext";
import { createStyles } from "../styles/display.styles";

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

const ExerciseItem = React.memo(
  ({ item, onPress, searchText, isSelected, styles, colors }) => {
    const [imageError, setImageError] = useState(false);
    const imagePath = item.local_media_path
      ? `${FileSystem.cacheDirectory}app_media/exercises/${item.local_media_path}`
      : null;

    return (
      <TouchableOpacity
        style={[styles.exerciseItem, isSelected && styles.selectedExerciseItem]}
        onPress={() => onPress(item)}
      >
        <View style={styles.exerciseRow}>
          <View style={styles.exerciseIconContainer}>
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={colors.primaryBlue}
              />
            ) : imagePath && !imageError ? (
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
            color={isSelected ? colors.primaryBlue : colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  }
);

const AddExercisePage = ({ route }) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadExercises = async () => {
      try {
        setLoading(true);
        const data = await exercisesAPI.getExercises();
        if (isMounted) {
          const sortedData = (data || []).sort((a, b) => a.name.localeCompare(b.name));
          setExercises(sortedData);
          setFilteredExercises(sortedData);
          setSelectedExercises([]);
        }
      } catch (error) {
        console.error("Failed to load exercises:", error);
        if (isMounted) {
          setError("Failed to load exercises");
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExercises();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

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
      setFilteredExercises(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setFilteredExercises([...exercises].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [searchText, exercises]);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercises((prev) => {
      const isSelected = prev.some(
        (e) => e.exercise_id === exercise.exercise_id
      );
      if (isSelected) {
        return prev.filter((e) => e.exercise_id !== exercise.exercise_id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleAddSelected = () => {
    if (selectedExercises.length > 0) {
      const onExercisesSelected = route?.params?.onExercisesSelected;

      if (onExercisesSelected && typeof onExercisesSelected === "function") {
        // Use callback - this is the proper way
        onExercisesSelected(selectedExercises);
      }

      // Always go back
      navigation.goBack();
    }
  };

  const renderExerciseItem = ({ item }) => {
    const isSelected = selectedExercises.some(
      (e) => e.exercise_id === item.exercise_id
    );

    return (
      <ExerciseItem
        item={item}
        onPress={handleExerciseSelect}
        searchText={searchText}
        isSelected={isSelected}
        styles={styles}
        colors={colors}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer}>
        <Header
          title="Add Exercise"
          leftComponent={{
            type: "custom",
            icon: "close-outline",
            onPress: () => navigation.goBack()
          }}
          rightComponent={{
            type: "button",
            text: "Create",
            onPress: () => navigation.navigate("CreateExercise")
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
            contentContainerStyle={[
              styles.listContentContainer,
              selectedExercises.length > 0 && {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80,
              },
            ]}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No exercises found</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>

      {/* Bottom Add Button - Outside SafeAreaView for proper absolute positioning */}
      {selectedExercises.length > 0 && (
        <View
          style={[
            styles.bottomButtonContainer,
            {
              position: "absolute",
              bottom: keyboardHeight > 0 ? keyboardHeight + 10 : 20,
              left: 0,
              right: 0,
              zIndex: 1000,
              pointerEvents: "box-none",
            },
          ]}
        >
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddSelected}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>
              Add {selectedExercises.length} exercise
              {selectedExercises.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AddExercisePage;
