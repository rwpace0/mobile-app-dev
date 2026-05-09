import React, { useMemo } from "react";
import { View, Text, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { useTheme } from "../../state/SettingsContext";
import { Button } from "../ui/Button";
import { Spacing } from "../../constants/theme";
import {
  hapticLight,
  hapticWarning,
} from "../../utils/hapticFeedback";

const FinishWorkoutModal = ({
  visible,
  onClose,
  mode, // 'incompleteSets' | 'routineUpdate'
  newExercisesCount = 0,
  newSetsCount = 0,
  addedExercises = 0,
  removedExercises = 0,
  addedSets = 0,
  removedSets = 0,
  onCompleteSets,
  onDiscardSets,
  onUpdateRoutine,
  onKeepRoutineSame,
}) => {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  if (mode === "incompleteSets") {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.centerModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalText}>
              Complete Unfinished Sets?
            </Text>
            <Text style={styles.deleteModalSubtext}>
              You have sets that haven't been completed. What would you like to
              do?
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                variant="primary"
                title="Complete Unfinished Sets"
                onPress={() => {
                  if (onCompleteSets) onCompleteSets();
                  onClose();
                }}
                style={{ width: "100%", marginBottom: Spacing.xs }}
              />
              <Button
                variant="danger"
                title="Discard Unfinished Sets"
                onPress={() => {
                  hapticWarning();
                  if (onDiscardSets) onDiscardSets();
                  onClose();
                }}
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
  }

  if (mode === "routineUpdate") {
    // Build change summary text
    const changeLines = [];

    if (addedExercises > 0) {
      const text = addedExercises === 1 ? "exercise" : "exercises";
      changeLines.push(`Added ${addedExercises} ${text}`);
    }

    if (removedExercises > 0) {
      const text = removedExercises === 1 ? "exercise" : "exercises";
      changeLines.push(`Removed ${removedExercises} ${text}`);
    }

    if (addedSets > 0) {
      const text = addedSets === 1 ? "set" : "sets";
      changeLines.push(`Added ${addedSets} ${text}`);
    }

    if (removedSets > 0) {
      const text = removedSets === 1 ? "set" : "sets";
      changeLines.push(`Removed ${removedSets} ${text}`);
    }

    const changeSummary = changeLines.join(", ");

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.centerModalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalText}>
              Update Routine with Changes?
            </Text>
            <Text style={styles.deleteModalSubtext}>
              {changeSummary}. Would you like to update the routine or keep it
              the same?
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                variant="primary"
                title="Update Routine"
                onPress={() => {
                  if (onUpdateRoutine) onUpdateRoutine();
                  onClose();
                }}
                style={{ width: "100%", marginBottom: Spacing.xs }}
              />
              <Button
                variant="danger"
                title="Keep Routine Same"
                onPress={() => {
                  hapticLight();
                  if (onKeepRoutineSame) onKeepRoutineSame();
                  onClose();
                }}
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
  }

  return null;
};

export default FinishWorkoutModal;
