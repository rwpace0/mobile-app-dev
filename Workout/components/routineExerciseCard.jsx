import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { SwipeListView } from "react-native-swipe-list-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { getColors } from "../constants/colors";
import { FontSize } from "../constants/theme";
import { createStyles } from "../styles/activeExercise.styles";
import { useTheme, useSettings } from "../state/SettingsContext";
import RestTimerModal from "./modals/RestTimerModal";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import exercisesAPI from "../API/exercisesAPI";
import { useWeight } from "../utils/useWeight";
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
} from "../utils/hapticFeedback";

const RoutineExerciseComponent = ({
  exercise,
  onUpdateSets,
  onRemoveExercise,
  drag,
  isActive,
}) => {
  const { isDark } = useTheme();
  const { showPreviousPerformance, showRir } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const inputRefs = useRef({});
  const lastReportedSetsCount = useRef(0);

  const [sets, setSets] = useState([]);
  const [notes, setNotes] = useState("");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Animation state
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(300);
  const animatedOpacity = useSharedValue(1);

  // Initialize sets based on exercise.sets count
  useEffect(() => {
    const numSets = exercise.sets || 1;
    // Only update if the count actually changed
    if (sets.length !== numSets) {
      const initialSets = Array(numSets)
        .fill()
        .map((_, index) => ({
          id: (index + 1).toString(),
          weight: "",
          reps: "",
          rir: "",
          total: "",
          completed: false,
        }));
      setSets(initialSets);
      lastReportedSetsCount.current = numSets;
    }
  }, [exercise.sets]);

  // Update parent when sets count changes (but not when initializing or when parent updates)
  useEffect(() => {
    const currentCount = sets.length;
    const expectedCount = exercise.sets || 1;

    // Only update if:
    // 1. We have sets
    // 2. Count is different from what parent expects
    // 3. Count is different from what we last reported (avoid duplicate calls)
    if (
      onUpdateSets &&
      currentCount > 0 &&
      currentCount !== expectedCount &&
      currentCount !== lastReportedSetsCount.current
    ) {
      lastReportedSetsCount.current = currentCount;
      onUpdateSets(exercise.exercise_id, currentCount);
    }
  }, [sets.length, exercise.exercise_id]);

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        const details = await exercisesAPI.getExerciseById(
          exercise.exercise_id
        );
        setExerciseDetails(details);
      } catch (error) {
        console.error("Failed to fetch exercise details:", error);
      }
    };

    fetchExerciseDetails();
  }, [exercise.exercise_id]);

  // Update animation values when content height changes
  useEffect(() => {
    if (contentHeight > 0) {
      animatedHeight.value = withTiming(contentHeight, { duration: 100 });
    }
  }, [contentHeight]);

  // Handle drag animation
  useEffect(() => {
    if (isActive) {
      animatedHeight.value = withTiming(0, { duration: 200 });
      animatedOpacity.value = withTiming(0, { duration: 200 });
    } else {
      const targetHeight = contentHeight > 0 ? contentHeight : 300;
      animatedHeight.value = withTiming(targetHeight, { duration: 200 });
      animatedOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, contentHeight]);

  const formatTime = (seconds) => {
    if (seconds === 0) return "Off";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleWeightChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(value) || 0;
          const reps = parseFloat(set.reps) || 0;
          return {
            ...set,
            weight: value,
            total: Math.round(weight * reps).toString(),
          };
        }
        return set;
      })
    );
  };

  const handleRepsChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(set.weight) || 0;
          const reps = parseFloat(value) || 0;
          return {
            ...set,
            reps: value,
            total: Math.round(weight * reps).toString(),
          };
        }
        return set;
      })
    );
  };

  const handleRirChange = (id, value) => {
    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          return {
            ...set,
            rir: value,
          };
        }
        return set;
      })
    );
  };

  const handleAddSet = () => {
    hapticLight();
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const newSetId =
      sets.length > 0 && lastSet.id !== "W"
        ? (parseInt(lastSet.id) + 1).toString()
        : "1";

    let defaultWeight = lastSet ? lastSet.weight : "";
    let defaultReps = lastSet ? lastSet.reps : "";

    const newSet = {
      id: newSetId,
      weight: defaultWeight,
      reps: defaultReps,
      rir: "",
      total:
        defaultWeight && defaultReps
          ? Math.round(
              parseFloat(defaultWeight) * parseFloat(defaultReps)
            ).toString()
          : "",
      completed: false,
    };
    setSets([...sets, newSet]);
  };

  const handleDeleteSet = (setId) => {
    hapticMedium();
    const newSets = sets.filter((set) => set.id !== setId);
    // Renumber sets
    const renumberedSets = newSets.map((set, index) => ({
      ...set,
      id: (index + 1).toString(),
    }));
    setSets(renumberedSets);
  };

  const toggleSetCompletion = (index) => {
    setSets((prev) =>
      prev.map((set, idx) => {
        if (idx === index) {
          const newSet = { ...set, completed: !set.completed };
          if (newSet.completed && !set.completed) {
            hapticSuccess();
          } else {
            hapticLight();
          }
          return newSet;
        }
        return set;
      })
    );
  };

  const handleRestTimeSelect = (seconds) => {
    hapticLight();
    setRestTime(seconds);
    setShowRestTimer(false);
  };

  // Measure collapsible content height
  const handleContentLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  // Animated styles for collapsible content
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: animatedOpacity.value,
      overflow: "hidden",
    };
  });

  // Convert sets to the format expected by SwipeListView
  const swipeListData = sets.map((set, index) => ({
    key: `${set.id}-${index}`,
    set: set,
    index: index,
  }));

  // Render the front row (visible content)
  const renderItem = ({ item }) => {
    const { set, index } = item;

    return (
      <View
        style={[
          styles.setRow,
          index % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
          set.completed && styles.completedSetRow,
        ]}
      >
        <View style={styles.setNumberCell}>
          <Text style={styles.setCell}>{set.id}</Text>
        </View>
        {showPreviousPerformance && (
          <View style={styles.previousCell}>
            <Text
              style={[
                styles.setCell,
                { color: colors.textSecondary, fontSize: FontSize.small },
              ]}
            >
              -
            </Text>
          </View>
        )}
        <View style={styles.weightHeaderCell}>
          <TextInput
            ref={(ref) => {
              if (!inputRefs.current[set.id]) inputRefs.current[set.id] = {};
              inputRefs.current[set.id].weight = ref;
            }}
            style={styles.weightInput}
            value={set.weight}
            onChangeText={(value) => handleWeightChange(set.id, value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus={true}
          />
        </View>
        <View style={styles.repsHeaderCell}>
          <TextInput
            ref={(ref) => {
              if (inputRefs.current[set.id])
                inputRefs.current[set.id].reps = ref;
            }}
            style={styles.repsInput}
            value={set.reps}
            onChangeText={(value) => handleRepsChange(set.id, value)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus={true}
          />
        </View>
        {showRir && (
          <View style={styles.rirHeaderCell}>
            <TextInput
              ref={(ref) => {
                if (inputRefs.current[set.id])
                  inputRefs.current[set.id].rir = ref;
              }}
              style={styles.rirInput}
              value={set.rir}
              onChangeText={(value) => handleRirChange(set.id, value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              selectTextOnFocus={true}
            />
          </View>
        )}
        {!showPreviousPerformance && !showRir && (
          <View style={styles.totalCell}>
            <Text style={styles.setCell}>{set.total}</Text>
          </View>
        )}
        <View style={styles.completedCell}>
          <TouchableOpacity onPress={() => toggleSetCompletion(index)}>
            <View
              style={[
                styles.checkmarkContainer,
                set.completed && styles.completedCheckmark,
              ]}
            >
              <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render the hidden row (delete action)
  const renderHiddenItem = ({ item }) => (
    <View style={styles.hiddenItemContainer}>
      <View style={styles.hiddenItemLeft} />
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteSet(item.set.id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        isActive && { opacity: 0.8, transform: [{ scale: 1.02 }] },
      ]}
    >
      {/* Always visible header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exerciseTitleRow}
          onLongPress={drag}
          disabled={!drag}
          activeOpacity={0.8}
        >
          <View style={styles.exerciseIconContainer}>
            {exerciseDetails?.local_media_path && !imageError ? (
              <Image
                source={{
                  uri: `file://${FileSystem.cacheDirectory}app_media/exercises/${exerciseDetails.local_media_path}`,
                }}
                style={styles.exerciseImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Ionicons name="barbell" size={24} color={colors.textPrimary} />
            )}
          </View>
          <Text style={[styles.exerciseName, isActive && { opacity: 0.5 }]}>
            {exerciseDetails?.name || ""}
          </Text>
        </TouchableOpacity>

        {!isActive && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Ionicons name="trash-outline" size={24} color={colors.accentRed} />
          </TouchableOpacity>
        )}
      </View>

      {/* Collapsible content */}
      <Animated.View style={animatedContentStyle}>
        <View onLayout={handleContentLayout}>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes here..."
              placeholderTextColor={colors.textFaded}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity
            style={styles.restTimerContainer}
            onPress={() => setShowRestTimer(true)}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={restTime === 0 ? colors.textFaded : colors.primaryBlue}
            />
            <Text
              style={[
                styles.restTimerText,
                restTime === 0 && styles.timerOffText,
              ]}
            >
              {`Rest Timer: ${formatTime(restTime)}`}
            </Text>
          </TouchableOpacity>

          {/* Sets List */}
          <View style={styles.setsContainer}>
            {/* Header Row */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setHeaderCell, styles.setNumberCell]}>
                SET
              </Text>
              {showPreviousPerformance && (
                <Text style={[styles.setHeaderCell, styles.previousCell]}>
                  PREVIOUS
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.weightHeaderCell]}>
                {weight.unitLabel()}
              </Text>
              <Text style={[styles.setHeaderCell, styles.repsHeaderCell]}>
                REPS
              </Text>
              {showRir && (
                <Text style={[styles.setHeaderCell, styles.rirHeaderCell]}>
                  RIR
                </Text>
              )}
              {!showPreviousPerformance && !showRir && (
                <Text style={[styles.setHeaderCell, styles.totalCell]}>
                  TOTAL
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
            </View>

            {/* Swipe List for Sets */}
            <SwipeListView
              data={swipeListData}
              renderItem={renderItem}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              disableRightSwipe={true}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              closeOnRowBeginSwipe={false}
              closeOnScroll={false}
              closeOnRowPress={false}
              closeOnRowOpen={false}
            />
          </View>

          {/* Add Set Button */}
          <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <RestTimerModal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        onSelectTime={handleRestTimeSelect}
        currentTime={restTime}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onRemoveExercise(exercise.exercise_id);
        }}
        title={`Delete ${exerciseDetails?.name || "Exercise"}?`}
      />
    </View>
  );
};

export default RoutineExerciseComponent;
