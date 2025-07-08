import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../styles/activeMini.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../state/SettingsContext';

const ActiveMini = ({ 
  visible, 
  onResume, 
  workoutName = "Active Workout",
  duration = 0 
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // Format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.content}
        onPress={onResume}
        activeOpacity={0.8}
      >
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActiveMini; 