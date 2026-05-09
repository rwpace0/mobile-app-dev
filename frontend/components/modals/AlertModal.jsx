import React, { useMemo } from "react";
import { View, Text, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { useTheme } from "../../state/SettingsContext";
import { Button } from "../ui/Button";
import { hapticLight, hapticMedium } from "../../utils/hapticFeedback";

const AlertModal = ({
  visible,
  onClose,
  message,
  confirmText = "Ok",
  onConfirm,
  showCancel = false,
  cancelText = "Cancel",
  onCancel,
}) => {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const handleConfirm = () => {
    hapticMedium();
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    hapticLight();
    if (onCancel) {
      onCancel();
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
        <View style={styles.alertModalContent}>
          <Text style={styles.alertModalText}>{message}</Text>
          <View style={styles.alertModalButtons}>
            {showCancel && (
              <Button
                variant="secondary"
                title={cancelText}
                onPress={handleCancel}
                style={{ flex: 1 }}
              />
            )}
            <Button
              variant="primary"
              title={confirmText}
              onPress={handleConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
