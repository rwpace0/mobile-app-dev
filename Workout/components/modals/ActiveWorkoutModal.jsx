import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { hapticLight, hapticMedium, hapticSuccess } from "../../utils/hapticFeedback";

const ActiveWorkoutModal = ({
  visible,
  onClose,
  onResumeWorkout,
  onStartNew
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const handleResumeWorkout = () => {
    hapticSuccess();
    if (onResumeWorkout) {
      onResumeWorkout();
    }
    onClose();
  };

  const handleStartNew = () => {
    hapticMedium();
    if (onStartNew) {
      onStartNew();
    }
    onClose();
  };

  const handleCancel = () => {
    hapticLight();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centerModalContainer}>
        <View style={styles.activeWorkoutModalContent}>
          <Text style={styles.activeWorkoutModalText}>
            You have a workout in progress
          </Text>
          <View style={styles.activeWorkoutModalButtons}>
            <TouchableOpacity
              style={styles.activeWorkoutResumeButton}
              onPress={handleResumeWorkout}
              activeOpacity={0.7}
            >
              <Text style={styles.activeWorkoutResumeButtonText}>Resume workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activeWorkoutStartNewButton}
              onPress={handleStartNew}
              activeOpacity={0.7}
            >
              <Text style={styles.activeWorkoutStartNewButtonText}>Start new workout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activeWorkoutCancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.activeWorkoutCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ActiveWorkoutModal;
