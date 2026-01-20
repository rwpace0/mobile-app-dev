import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useSettings } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { FontSize } from "../../constants/theme";
import { createStyles } from "../../styles/activeExercise.styles";
import { useWeight } from "../../utils/useWeight";
import SwipeToDelete from "../../animations/SwipeToDelete";

const SetRow = ({
  set,
  index,
  exercise,
  onWeightChange,
  onRepsChange,
  onRirChange,
  onToggleCompletion,
  onDelete,
  correspondingPreviousSet,
  loadingPrevious,
  inputRefs,
}) => {
  const { isDark } = useTheme();
  const { showPreviousPerformance, showRir } = useSettings();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();

  // Use set.key if available for stable React keys
  const setKey = set.key || `set-${set.id}-${index}`;

  return (
    <View key={setKey}>
      {/* Swipeable set row using SwipeToDelete */}
      <SwipeToDelete
        onDelete={() => onDelete(set.id, `${set.id}-${index}`)}
        style={{}}
        deleteButtonColor={colors.accentRed}
      >
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
                  {
                    color: set.completed
                      ? colors.textPrimary
                      : colors.textSecondary,
                    fontSize: FontSize.small,
                  },
                ]}
              >
                {correspondingPreviousSet
                  ? `${correspondingPreviousSet.weight}${weight.unit} × ${
                      correspondingPreviousSet.reps
                    }${
                      correspondingPreviousSet.rir !== null &&
                      correspondingPreviousSet.rir !== undefined
                        ? ` @ ${correspondingPreviousSet.rir}`
                        : ""
                    }`
                  : loadingPrevious
                  ? "-"
                  : "-"}
              </Text>
            </View>
          )}
          <View style={styles.weightHeaderCell}>
            <TextInput
              ref={(ref) => {
                if (!inputRefs.current[set.id])
                  inputRefs.current[set.id] = {};
                inputRefs.current[set.id].weight = ref;
              }}
              style={[
                styles.weightInput,
                {
                  color: set.completed
                    ? colors.textPrimary
                    : colors.textSecondary,
                },
              ]}
              value={set.weight}
              onChangeText={(value) => onWeightChange(set.id, value)}
              keyboardType="numeric"
              maxLength={7}
              placeholder={
                showPreviousPerformance && correspondingPreviousSet
                  ? correspondingPreviousSet.weight + ""
                  : "0"
              }
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
              style={[
                styles.repsInput,
                {
                  color: set.completed
                    ? colors.textPrimary
                    : colors.textSecondary,
                },
              ]}
              value={set.reps}
              onChangeText={(value) => onRepsChange(set.id, value)}
              keyboardType="numeric"
              maxLength={3}
              placeholder={
                // Prioritize template ranges over previous workout values
                exercise.rep_range_min !== null &&
                exercise.rep_range_min !== undefined &&
                exercise.rep_range_max !== null &&
                exercise.rep_range_max !== undefined
                  ? `${exercise.rep_range_min}-${exercise.rep_range_max}`
                  : showPreviousPerformance && correspondingPreviousSet
                  ? correspondingPreviousSet.reps.toString()
                  : "0"
              }
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
                style={[
                  styles.rirInput,
                  {
                    color: set.completed
                      ? colors.textPrimary
                      : colors.textSecondary,
                  },
                ]}
                value={set.rir}
                onChangeText={(value) => onRirChange(set.id, value)}
                keyboardType="numeric"
                maxLength={2}
                placeholder={
                  // Prioritize template ranges over previous workout values
                  exercise.rir_range_min !== null &&
                  exercise.rir_range_min !== undefined &&
                  exercise.rir_range_max !== null &&
                  exercise.rir_range_max !== undefined
                    ? `${exercise.rir_range_min}-${exercise.rir_range_max}`
                    : showPreviousPerformance && correspondingPreviousSet
                    ? correspondingPreviousSet.rir !== null &&
                      correspondingPreviousSet.rir !== undefined
                      ? correspondingPreviousSet.rir.toString()
                      : "0"
                    : "0"
                }
                placeholderTextColor={colors.textSecondary}
                selectTextOnFocus={true}
              />
            </View>
          )}
          <View style={styles.completedCell}>
            <TouchableOpacity onPress={() => onToggleCompletion(index)}>
              <View
                style={[
                  styles.checkmarkContainer,
                  set.completed && styles.completedCheckmark,
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={colors.textPrimary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SwipeToDelete>
    </View>
  );
};

export default SetRow;
