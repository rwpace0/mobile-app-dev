import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../styles/activeMini.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../state/SettingsContext';
import { formatDurationClock } from '../utils/timerUtils';

const ActiveMini = ({ 
  visible, 
  onResume, 
  workoutName = "Active Workout",
  duration = 0 
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.content}
        onPress={onResume}
        activeOpacity={0.8}
      >
        <Text style={styles.duration}>{formatDurationClock(duration)}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActiveMini; 