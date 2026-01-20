import React, { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useTheme, useSettings } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/activeExercise.styles";
import RestTimerModal from "../modals/RestTimerModal";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";
import exercisesAPI from "../../API/exercisesAPI";
import { useSetTimers } from "./hooks/useSetTimers";
import { usePreviousPerformance } from "./hooks/usePreviousPerformance";
import { useExerciseState } from "./hooks/useExerciseState";
import ExerciseHeader from "./ExerciseHeader";
import NotesInput from "./NotesInput";
import RestTimerButton from "./RestTimerButton";
import SetsList from "./SetsList";

const ActiveExerciseComponent = ({
  exercise,
  onUpdateTotals,
  onRemoveExercise,
  onStateChange,
  initialState,
  drag,
  isActive,
  onTimerStart,
}) => {
  const { isDark, showNotes, restTimerEnabled, timerType } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // Modal state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exerciseDetails, setExerciseDetails] = useState(null);

  // Animation state
  const [contentHeight, setContentHeight] = useState(0);
  const [isContentMeasured, setIsContentMeasured] = useState(false);
  const animatedHeight = useSharedValue(300);
  const animatedOpacity = useSharedValue(1);
  const [needsRemeasurement, setNeedsRemeasurement] = useState(false);

  // Fetch exercise details
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

  // Get initial sets
  const initialSets = initialState?.sets || exercise.sets || [];

  // Custom hooks - order matters: timers first (with initial sets), then previous performance, then exercise state
  const timerHandlers = useSetTimers(initialSets, initialState);

  const previousPerformance = usePreviousPerformance(
    exercise,
    initialSets,
    !!initialState?.sets
  );

  const exerciseState = useExerciseState(
    exercise,
    initialState,
    onUpdateTotals,
    onStateChange,
    onTimerStart,
    previousPerformance.previousWorkoutSets,
    timerHandlers
  );

  // Initialize sets from previous workout if needed
  useEffect(() => {
    const initialSetsFromPrevious = previousPerformance.generateInitialSets();
    if (initialSetsFromPrevious && exerciseState.sets.length === 0 && !exerciseState.hasPrefilledData) {
      exerciseState.initializeSets(initialSetsFromPrevious);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousPerformance.previousWorkoutSets.length]);

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

  // Trigger remeasurement when sets change
  useEffect(() => {
    setNeedsRemeasurement(true);
  }, [exerciseState.sets]);

  // Measure collapsible content height
  const handleContentLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      if (height !== contentHeight) {
        setContentHeight(height);
        setIsContentMeasured(true);
        setNeedsRemeasurement(false);
      }
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

  const handleRestTimeSelect = (seconds) => {
    exerciseState.handleRestTimeSelect(seconds);
    setShowRestTimer(false);
  };

  return (
    <View
      style={[
        styles.container,
        isActive && { opacity: 0.8, transform: [{ scale: 1.02 }] },
      ]}
    >
      {/* Always visible header */}
      <ExerciseHeader
        exercise={exercise}
        drag={drag}
        isActive={isActive}
        onDeletePress={() => setShowDeleteConfirm(true)}
      />

      {/* Collapsible content */}
      <Animated.View style={animatedContentStyle}>
        <View onLayout={handleContentLayout}>
          <NotesInput
            notes={exerciseState.notes}
            onNotesChange={exerciseState.setNotes}
            showNotes={showNotes}
          />

          <RestTimerButton
            restTime={exerciseState.restTime}
            onPress={() => setShowRestTimer(true)}
            restTimerEnabled={restTimerEnabled}
            timerType={timerType}
          />

          <SetsList
            sets={exerciseState.sets}
            exercise={exercise}
            onWeightChange={exerciseState.handleWeightChange}
            onRepsChange={exerciseState.handleRepsChange}
            onRirChange={exerciseState.handleRirChange}
            onToggleCompletion={exerciseState.toggleSetCompletion}
            onDeleteSet={exerciseState.handleDeleteSet}
            onAddSet={exerciseState.handleAddSet}
            previousWorkoutSets={previousPerformance.previousWorkoutSets}
            loadingPrevious={previousPerformance.loadingPrevious}
            inputRefs={exerciseState.inputRefs}
            timerType={timerType}
            setTimers={timerHandlers.setTimers}
            activeSetTimer={timerHandlers.activeSetTimer}
            setTimerRemaining={timerHandlers.setTimerRemaining}
            onSetTimerChange={timerHandlers.handleSetTimerChange}
            DEFAULT_SET_TIMER={timerHandlers.DEFAULT_SET_TIMER}
          />
        </View>
      </Animated.View>

      <RestTimerModal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        onSelectTime={handleRestTimeSelect}
        currentTime={exerciseState.restTime}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={onRemoveExercise}
        title={`Delete ${exerciseDetails?.name || exercise.name || "Exercise"}?`}
      />
    </View>
  );
};

export default ActiveExerciseComponent;
