import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { hapticLight, hapticWarning } from "../../utils/hapticFeedback";

const RoutineDeleteModal = ({
  visible,
  onClose,
  onDeleteRoutine,
  routineName,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centerModalContainer}>
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalText}>Delete "{routineName}"?</Text>
          <Text style={styles.deleteModalSubtext}>
            This routine and all its exercises will be permanently deleted.
          </Text>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.deleteModalConfirmButton}
              onPress={() => {
                hapticWarning();
                onDeleteRoutine();
                onClose();
              }}
            >
              <Text style={styles.deleteModalConfirmText}>Delete Routine</Text>
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
};

export default RoutineDeleteModal;
