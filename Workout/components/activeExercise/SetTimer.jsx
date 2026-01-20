import React from "react";
import { View, Text, TextInput } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/activeExercise.styles";
import { parseTimeInput, formatSetTimerDisplay } from "../../utils/timerUtils";

const SetTimer = ({
  setId,
  set,
  timerValue,
  isActive,
  timerRemaining,
  onTimerChange,
  inputRef,
  DEFAULT_SET_TIMER,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  if (!isActive && timerRemaining === undefined) {
    // Timer input - always visible when timer is not active
    return (
      <View style={styles.setTimerInputContainer}>
        <View
          style={[
            styles.setTimerLine,
            set.completed
              ? styles.setTimerLineCompleted
              : styles.setTimerLineIncomplete,
          ]}
        />
        <TextInput
          ref={inputRef}
          style={[
            styles.setTimerInputField,
            set.completed
              ? styles.setTimerInputFieldCompleted
              : styles.setTimerInputFieldIncomplete,
          ]}
          value={timerValue || DEFAULT_SET_TIMER}
          onChangeText={(value) => onTimerChange(setId, value)}
          keyboardType="numeric"
          maxLength={6}
          placeholder={DEFAULT_SET_TIMER}
          placeholderTextColor={colors.textSecondary}
          selectTextOnFocus={true}
          editable={!set.completed}
        />
        <View
          style={[
            styles.setTimerLine,
            set.completed
              ? styles.setTimerLineCompleted
              : styles.setTimerLineIncomplete,
          ]}
        />
      </View>
    );
  }

  if (isActive && timerRemaining > 0) {
    // Progress bar - only show when timer is actively counting down
    const totalSeconds = parseTimeInput(timerValue || DEFAULT_SET_TIMER);
    const progressPercent = (timerRemaining / totalSeconds) * 100;

    return (
      <View style={styles.setTimerProgressContainer}>
        <Animated.View
          style={[
            styles.setTimerProgressBar,
            {
              width: `${progressPercent}%`,
            },
          ]}
        />
        <Text style={styles.setTimerCountdown}>
          {formatSetTimerDisplay(timerRemaining)}
        </Text>
      </View>
    );
  }

  return null;
};

export default SetTimer;
