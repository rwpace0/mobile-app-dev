import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { hapticLight, hapticSuccess, hapticWarning } from "../../utils/hapticFeedback";

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
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

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
              <TouchableOpacity
                style={styles.primaryModalButton}
                onPress={() => {
                  hapticSuccess();
                  if (onCompleteSets) onCompleteSets();
                  onClose();
                }}
              >
                <Text style={styles.primaryModalButtonText}>
                  Complete Unfinished Sets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={() => {
                  hapticWarning();
                  if (onDiscardSets) onDiscardSets();
                  onClose();
                }}
              >
                <Text style={styles.deleteModalConfirmText}>
                  Discard Unfinished Sets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  hapticLight();
                  onClose();
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.primaryModalButton}
                onPress={() => {
                  hapticSuccess();
                  if (onUpdateRoutine) onUpdateRoutine();
                  onClose();
                }}
              >
                <Text style={styles.primaryModalButtonText}>
                  Update Routine
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={() => {
                  hapticLight();
                  if (onKeepRoutineSame) onKeepRoutineSame();
                  onClose();
                }}
              >
                <Text style={styles.deleteModalConfirmText}>
                  Keep Routine Same
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => {
                  hapticLight();
                  onClose();
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
};

export default FinishWorkoutModal;
