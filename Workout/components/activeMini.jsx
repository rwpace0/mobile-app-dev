import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from '../styles/activeMini.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../state/SettingsContext';  

const ActiveMini = ({ 
  visible, 
  onResume, 
  onDiscard, 
  workoutName = "Active Workout",
  duration = 0 
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Ionicons 
              name="barbell" 
              size={20} 
              color={colors.primaryLight} 
            />
            <Text style={styles.title}>{workoutName}</Text>
          </View>
          {duration > 0 && (
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          )}
        </View>
        
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={styles.discardButton}
            onPress={onDiscard}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resumeButton}
            onPress={onResume}
          >
            <Text style={styles.resumeButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ActiveMini; 