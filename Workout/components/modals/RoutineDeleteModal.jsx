import React, { useMemo } from "react";
import { View, Text, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { useTheme } from "../../state/SettingsContext";
import { Button } from "../ui/Button";
import { hapticWarning } from "../../utils/hapticFeedback";
import { Spacing } from "../../constants/theme";

const RoutineDeleteModal = ({
  visible,
  onClose,
  onDeleteRoutine,
  routineName,
}) => {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

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
            <Button
              variant="danger"
              title="Delete Routine"
              onPress={() => {
                hapticWarning();
                onDeleteRoutine();
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
};

export default RoutineDeleteModal;
