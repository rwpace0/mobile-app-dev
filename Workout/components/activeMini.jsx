import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStyles } from '../styles/activeMini.styles';
import { getColors } from '../constants/colors';
import { useTheme } from '../state/SettingsContext';
import DeleteConfirmModal from './modals/DeleteConfirmModal';

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
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const handleDiscardPress = () => {
    setShowDiscardModal(true);
  };

  const handleDiscardConfirm = () => {
    setShowDiscardModal(false);
    onDiscard();
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.workoutName}>{workoutName}</Text>
          
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.discardButton}
              onPress={handleDiscardPress}
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
      
      <DeleteConfirmModal
        visible={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleDiscardConfirm}
        title="Discard Workout?"
      />
    </>
  );
};

export default ActiveMini; 