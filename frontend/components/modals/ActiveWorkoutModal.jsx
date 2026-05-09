import React, { useMemo } from "react";
import { View, Text, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { useTheme } from "../../state/SettingsContext";
import { Button } from "../ui/Button";
import {
  hapticMedium,
  hapticSuccess,
} from "../../utils/hapticFeedback";
import { Spacing } from "../../constants/theme";

const ActiveWorkoutModal = ({
  visible,
  onClose,
  onResumeWorkout,
  onStartNew,
}) => {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

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
            <Button
              variant="primary"
              title="Resume workout"
              onPress={handleResumeWorkout}
              style={{ width: "100%", marginBottom: Spacing.xs }}
            />
            <Button
              variant="danger"
              title="Start new workout"
              onPress={handleStartNew}
              style={{ width: "100%", marginBottom: Spacing.xs }}
            />
            <Button
              variant="secondary"
              title="Cancel"
              onPress={onClose}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ActiveWorkoutModal;
