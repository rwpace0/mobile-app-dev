import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useSettings } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/activeExercise.styles";
import { useWeight } from "../../utils/useWeight";
import SetRow from "./SetRow";
import SetTimer from "./SetTimer";

const SetsList = ({
  sets,
  exercise,
  onWeightChange,
  onRepsChange,
  onRirChange,
  onToggleCompletion,
  onDeleteSet,
  onAddSet,
  previousWorkoutSets,
  loadingPrevious,
  inputRefs,
  timerType,
  setTimers,
  activeSetTimer,
  setTimerRemaining,
  onSetTimerChange,
  DEFAULT_SET_TIMER,
}) => {
  const { isDark } = useTheme();
  const { showPreviousPerformance, showRir } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();

  return (
    <View style={styles.setsContainer}>
      {/* Header Row */}
      <View style={styles.setHeaderRow}>
        <Text style={[styles.setHeaderCell, styles.setNumberCell]}>SET</Text>
        {showPreviousPerformance && (
          <Text style={[styles.setHeaderCell, styles.previousCell]}>
            PREVIOUS
          </Text>
        )}
        <Text style={[styles.setHeaderCell, styles.weightHeaderCell]}>
          {weight.unitLabel()}
        </Text>
        <Text style={[styles.setHeaderCell, styles.repsHeaderCell]}>REPS</Text>
        {showRir && (
          <Text style={[styles.setHeaderCell, styles.rirHeaderCell]}>RIR</Text>
        )}
        <Text style={[styles.setHeaderCell, styles.completedCell]}></Text>
      </View>

      {/* Sets List */}
      {sets.map((set, index) => {
        const correspondingPreviousSet = previousWorkoutSets[index];
        const isSetTimerActive = activeSetTimer === set.id;
        const timerRemaining = setTimerRemaining[set.id];
        // Use set.key if available, otherwise fall back to set.id for backward compatibility
        const setKey = set.key || `set-${set.id}-${index}`;

        return (
          <View key={setKey}>
            <SetRow
              set={set}
              index={index}
              exercise={exercise}
              onWeightChange={onWeightChange}
              onRepsChange={onRepsChange}
              onRirChange={onRirChange}
              onToggleCompletion={onToggleCompletion}
              onDelete={onDeleteSet}
              correspondingPreviousSet={correspondingPreviousSet}
              loadingPrevious={loadingPrevious}
              inputRefs={inputRefs}
            />

            {/* Timer below row - not swipeable */}
            {timerType === "set" && (
              <SetTimer
                setId={set.id}
                set={set}
                timerValue={setTimers[set.id]}
                isActive={isSetTimerActive}
                timerRemaining={timerRemaining}
                onTimerChange={onSetTimerChange}
                inputRef={(ref) => {
                  if (inputRefs.current[set.id])
                    inputRefs.current[set.id].timer = ref;
                }}
                DEFAULT_SET_TIMER={DEFAULT_SET_TIMER}
              />
            )}
          </View>
        );
      })}

      {/* Add Set Button */}
      <TouchableOpacity style={styles.addSetButton} onPress={onAddSet}>
        <Ionicons name="add" size={20} color={colors.textPrimary} />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SetsList;
