import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, useSettings } from "../../state/SettingsContext";
import { useThemeColors } from "../../constants/useThemeColors";
import { createStyles } from "../../styles/activeExercise.styles";
import { formatTime } from "../../utils/timerUtils";

const RestTimerButton = ({
  restTime,
  onPress,
  restTimerEnabled,
  timerType,
}) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  if (!restTimerEnabled || timerType !== "exercise") return null;

  return (
    <TouchableOpacity style={styles.restTimerContainer} onPress={onPress}>
      <Ionicons
        name="time-outline"
        size={20}
        color={restTime === 0 ? colors.textFaded : colors.primaryBlue}
      />
      <Text
        style={[styles.restTimerText, restTime === 0 && styles.timerOffText]}
      >
        {`Rest Timer: ${formatTime(restTime)}`}
      </Text>
    </TouchableOpacity>
  );
};

export default RestTimerButton;
