import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

const AlertModal = ({
  visible,
  onClose,
  message,
  confirmText = "Ok",
  onConfirm,
  showCancel = false,
  cancelText = "Cancel",
  onCancel
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
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
              <TouchableOpacity
                style={styles.alertModalButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.alertModalButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.alertModalButton}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.alertModalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal; 