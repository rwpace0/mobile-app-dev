import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { createStyles } from "../styles/activeRestTimer.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { hapticLight, hapticMedium } from "../utils/hapticFeedback";

const ActiveRestTimer = ({
  remainingTime,
  totalTime,
  onAdjustTime,
  onSkip,
  visible,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // Animated value for progress bar
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Update progress bar when remaining time changes
  useEffect(() => {
    if (totalTime > 0) {
      const progress = remainingTime / totalTime;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [remainingTime, totalTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Time display above buttons */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeDisplay}>{formatTime(remainingTime)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            hapticLight();
            onAdjustTime(-10);
          }}
        >
          <Text style={styles.buttonText}>-10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            hapticLight();
            onAdjustTime(10);
          }}
        >
          <Text style={styles.buttonText}>+10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.skipButton]}
          onPress={() => {
            hapticMedium();
            onSkip();
          }}
        >
          <Text style={[styles.buttonText, styles.skipButtonText]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActiveRestTimer;
