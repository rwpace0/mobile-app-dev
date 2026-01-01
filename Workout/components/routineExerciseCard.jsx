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
import RepModeModal from "./modals/RepModeModal";
import RirModeModal from "./modals/RirModeModal";
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
  const { showRir } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  const inputRefs = useRef({});
  const swipeListRef = useRef(null);
  const lastReportedSetsCount = useRef(0);

  const [sets, setSets] = useState([]);
  const [notes, setNotes] = useState("");
  const [restTime, setRestTime] = useState(150); // 2:30 default
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [repMode, setRepMode] = useState("single"); // 'single' or 'range'
  const [rirMode, setRirMode] = useState("single"); // 'single' or 'range'
  const [showRepModeModal, setShowRepModeModal] = useState(false);
  const [showRirModeModal, setShowRirModeModal] = useState(false);

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
          repRange: { min: "", max: "" },
          rir: "",
          rirRange: { min: "", max: "" },
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
    // Allow only numbers and one decimal point, max 7 characters (e.g., "9999.5")
    const sanitized = value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = sanitized.split(".");
    const filtered =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : sanitized;
    // Limit to 7 characters
    const limited = filtered.length > 7 ? filtered.slice(0, 7) : filtered;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          const weight = parseFloat(limited) || 0;
          if (repMode === "range") {
            const reps = parseFloat(set.repRange?.min) || 0;
            return {
              ...set,
              weight: limited,
              total: Math.round(weight * reps).toString(),
            };
          } else {
            const reps = parseFloat(set.reps) || 0;
            return {
              ...set,
              weight: limited,
              total: Math.round(weight * reps).toString(),
            };
          }
        }
        return set;
      })
    );
  };

  const handleRepsChange = (id, value, isMin = true) => {
    // Allow only whole numbers, max 3 digits (999)
    const sanitized = value.replace(/[^0-9]/g, "");
    const limited = sanitized.length > 3 ? sanitized.slice(0, 3) : sanitized;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          if (repMode === "range") {
            const newRepRange = {
              ...set.repRange,
              [isMin ? "min" : "max"]: limited,
            };
            const min = parseFloat(newRepRange.min) || 0;
            const max = parseFloat(newRepRange.max) || 0;
            const weight = parseFloat(set.weight) || 0;
            // Use min for total calculation
            const total = Math.round(weight * min).toString();
            return {
              ...set,
              repRange: newRepRange,
              total,
            };
          } else {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseFloat(limited) || 0;
            return {
              ...set,
              reps: limited,
              total: Math.round(weight * reps).toString(),
            };
          }
        }
        return set;
      })
    );
  };

  const handleRirChange = (id, value, isMin = true) => {
    // Allow only whole numbers, max 2 digits (99)
    const sanitized = value.replace(/[^0-9]/g, "");
    const limited = sanitized.length > 2 ? sanitized.slice(0, 2) : sanitized;

    setSets((prev) =>
      prev.map((set) => {
        if (set.id === id) {
          if (rirMode === "range") {
            return {
              ...set,
              rirRange: {
                ...set.rirRange,
                [isMin ? "min" : "max"]: limited,
              },
            };
          } else {
            return {
              ...set,
              rir: limited,
            };
          }
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
    let defaultRepRange = lastSet ? lastSet.repRange : { min: "", max: "" };
    let defaultRir = lastSet ? lastSet.rir : "";
    let defaultRirRange = lastSet ? lastSet.rirRange : { min: "", max: "" };

    const newSet = {
      id: newSetId,
      weight: defaultWeight,
      reps: defaultReps,
      repRange: defaultRepRange,
      rir: defaultRir,
      rirRange: defaultRirRange,
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

  const handleDeleteSet = (setId, rowKey) => {
    hapticMedium();
    // Close all open rows before deleting
    if (swipeListRef.current) {
      swipeListRef.current.closeAllOpenRows();
    }
    setSets((prev) => {
      // Filter out the deleted set
      const filtered = prev.filter((set) => set.id !== setId);
      // Renumber regular sets (skip warmup sets with id "W")
      let setNumber = 1;
      return filtered.map((set) => {
        if (set.id === "W") {
          // Keep warmup sets as-is
          return set;
        } else {
          // Renumber regular sets sequentially
          const newId = setNumber.toString();
          setNumber++;
          return {
            ...set,
            id: newId,
          };
        }
      });
    });
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
            maxLength={7}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            selectTextOnFocus={true}
          />
        </View>
        <View style={styles.repsHeaderCell}>
          {repMode === "range" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <TextInput
                ref={(ref) => {
                  if (!inputRefs.current[set.id])
                    inputRefs.current[set.id] = {};
                  inputRefs.current[set.id].repMin = ref;
                }}
                style={[styles.repsInput, { flex: 1, maxWidth: 45 }]}
                value={set.repRange?.min || ""}
                onChangeText={(value) => handleRepsChange(set.id, value, true)}
                keyboardType="numeric"
                maxLength={3}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                selectTextOnFocus={true}
              />
              <Text
                style={{ color: colors.textSecondary, fontSize: FontSize.base }}
              >
                -
              </Text>
              <TextInput
                ref={(ref) => {
                  if (!inputRefs.current[set.id])
                    inputRefs.current[set.id] = {};
                  inputRefs.current[set.id].repMax = ref;
                }}
                style={[styles.repsInput, { flex: 1, maxWidth: 45 }]}
                value={set.repRange?.max || ""}
                onChangeText={(value) => handleRepsChange(set.id, value, false)}
                keyboardType="numeric"
                maxLength={3}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                selectTextOnFocus={true}
              />
            </View>
          ) : (
            <TextInput
              ref={(ref) => {
                if (!inputRefs.current[set.id]) inputRefs.current[set.id] = {};
                inputRefs.current[set.id].reps = ref;
              }}
              style={styles.repsInput}
              value={set.reps}
              onChangeText={(value) => handleRepsChange(set.id, value)}
              keyboardType="numeric"
              maxLength={3}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              selectTextOnFocus={true}
            />
          )}
        </View>
        {showRir && (
          <View style={styles.rirHeaderCell}>
            {rirMode === "range" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <TextInput
                  ref={(ref) => {
                    if (!inputRefs.current[set.id])
                      inputRefs.current[set.id] = {};
                    inputRefs.current[set.id].rirMin = ref;
                  }}
                  style={[styles.rirInput, { flex: 1, maxWidth: 35 }]}
                  value={set.rirRange?.min || ""}
                  onChangeText={(value) => handleRirChange(set.id, value, true)}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  selectTextOnFocus={true}
                />
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: FontSize.base,
                  }}
                >
                  -
                </Text>
                <TextInput
                  ref={(ref) => {
                    if (!inputRefs.current[set.id])
                      inputRefs.current[set.id] = {};
                    inputRefs.current[set.id].rirMax = ref;
                  }}
                  style={[styles.rirInput, { flex: 1, maxWidth: 35 }]}
                  value={set.rirRange?.max || ""}
                  onChangeText={(value) =>
                    handleRirChange(set.id, value, false)
                  }
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  selectTextOnFocus={true}
                />
              </View>
            ) : (
              <TextInput
                ref={(ref) => {
                  if (!inputRefs.current[set.id])
                    inputRefs.current[set.id] = {};
                  inputRefs.current[set.id].rir = ref;
                }}
                style={styles.rirInput}
                value={set.rir}
                onChangeText={(value) => handleRirChange(set.id, value)}
                keyboardType="numeric"
                maxLength={2}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                selectTextOnFocus={true}
              />
            )}
          </View>
        )}
        {!showRir && (
          <View style={styles.totalCell}>
            <Text style={styles.setCell}>{set.total}</Text>
          </View>
        )}
        <View style={[styles.completedCell, { width: 24, minHeight: 24, alignSelf: 'stretch' }]} />
      </View>
    );
  };

  // Render the hidden row (delete action)
  const renderHiddenItem = ({ item }) => (
    <View style={styles.hiddenItemContainer}>
      <View style={styles.hiddenItemLeft} />
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDeleteSet(item.set.id, item.key)}
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
              <Text style={[styles.setHeaderCell, styles.weightHeaderCell]}>
                {weight.unitLabel()}
              </Text>
              <TouchableOpacity
                style={[styles.repsHeaderCell, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]}
                onPress={() => {
                  hapticLight();
                  setShowRepModeModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.setHeaderCell, { color: colors.textFaded }]}
                >
                  REPS
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textFaded} />
              </TouchableOpacity>
              {showRir && (
                <TouchableOpacity
                  style={[styles.rirHeaderCell, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }]}
                  onPress={() => {
                    hapticLight();
                    setShowRirModeModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.setHeaderCell, { color: colors.textFaded }]}
                  >
                    RIR
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textFaded} />
                </TouchableOpacity>
              )}
              {!showRir && (
                <Text style={[styles.setHeaderCell, styles.totalCell]}>
                  TOTAL
                </Text>
              )}
              <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
            </View>

            {/* Swipe List for Sets */}
            <SwipeListView
              ref={swipeListRef}
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

      <RepModeModal
        visible={showRepModeModal}
        onClose={() => setShowRepModeModal(false)}
        currentMode={repMode}
        onModeSelect={(mode) => {
          setRepMode(mode);
          // Reset rep values when switching modes
          setSets((prev) =>
            prev.map((set) => {
              if (mode === "range") {
                return {
                  ...set,
                  reps: "",
                  repRange: { min: "", max: "" },
                };
              } else {
                return {
                  ...set,
                  repRange: { min: "", max: "" },
                };
              }
            })
          );
        }}
      />

      <RirModeModal
        visible={showRirModeModal}
        onClose={() => setShowRirModeModal(false)}
        currentMode={rirMode}
        onModeSelect={(mode) => {
          setRirMode(mode);
          // Reset RIR values when switching modes
          setSets((prev) =>
            prev.map((set) => {
              if (mode === "range") {
                return {
                  ...set,
                  rir: "",
                  rirRange: { min: "", max: "" },
                };
              } else {
                return {
                  ...set,
                  rirRange: { min: "", max: "" },
                };
              }
            })
          );
        }}
      />
    </View>
  );
};

export default RoutineExerciseComponent;
