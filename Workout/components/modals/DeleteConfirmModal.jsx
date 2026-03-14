import React, { useMemo } from "react";
import { View, Text, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { useTheme } from "../../state/SettingsContext";
import { Button } from "../ui/Button";
import { Spacing } from "../../constants/theme";
import { hapticMedium } from "../../utils/hapticFeedback";

const DeleteConfirmModal = ({ visible, onClose, onConfirm, title }) => {
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
          <Text style={styles.deleteModalText}>{title}</Text>
          <View style={styles.deleteModalButtons}>
            <Button
              variant="danger"
              title="Delete"
              onPress={() => {
                hapticMedium();
                onConfirm();
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

export default DeleteConfirmModal;
