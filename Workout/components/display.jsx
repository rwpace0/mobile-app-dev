import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/display.styles";
import getExercises from "../API/getExercises";
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

const DisplayPage = ({ route }) => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);

  useEffect(() => {
    let isMounted = true;

    getExercises()
      .then((data) => {
        if (isMounted) {
          setExercises(data);
          setFilteredExercises(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError("Failed to load exercises");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
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
        const bodyPartMatch = exercise.bodyPart
          ?.toLowerCase()
          .includes(searchTermLower);
        const muscleGroupMatch = exercise.muscle_group
          ?.toLowerCase()
          .includes(searchTermLower);
        const instructionMatch = exercise.instruction
          ?.toLowerCase()
          .includes(searchTermLower);

        return (
          nameMatch || bodyPartMatch || muscleGroupMatch || instructionMatch
        );
      });
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises(exercises);
    }
  }, [searchText, exercises]);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercises((prev) => {
      const isSelected = prev.some((e) => e.id === exercise.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleAddSelected = () => {
    if (selectedExercises.length > 0) {
      if (route && route.params && route.params.returnTo) {
        navigation.navigate(route.params.returnTo, {
          selectedExercises: selectedExercises,
        });
      } else {
        navigation.navigate(
          navigation.getState().routes[navigation.getState().routes.length - 2]
            ?.name || "Home",
          {
            selectedExercises: selectedExercises,
          }
        );
      }
    }
  };

  const renderExerciseItem = ({ item }) => {
    const isSelected = selectedExercises.some((e) => e.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciseItem, isSelected && styles.selectedExerciseItem]}
        onPress={() => handleExerciseSelect(item)}
      >
        <View style={styles.exerciseRow}>
          <View style={styles.exerciseIconContainer}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "fitness-outline"}
              size={28}
              color={isSelected ? "#47A3FF" : "#BBBBBB"}
            />
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
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isSelected ? "#47A3FF" : "#777777"}
          />
        </View>
      </TouchableOpacity>
    );
  };

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
            onPress={handleAddSelected}
            disabled={selectedExercises.length === 0}
          >
            <Text
              style={[
                styles.headerActionText,
                selectedExercises.length > 0 && styles.headerActionTextActive,
              ]}
            >
              Add ({selectedExercises.length})
            </Text>
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExerciseItem}
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Text style={styles.emptyListText}>No exercises found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default DisplayPage;
