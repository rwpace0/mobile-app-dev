import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

const DeleteConfirmModal = ({ visible, onClose, onConfirm, title }) => {
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
          <Text style={styles.deleteModalText}>{title}</Text>
          <View style={styles.deleteModalButtons}>
          <TouchableOpacity 
              style={styles.deleteModalConfirmButton} 
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.deleteModalConfirmText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteModalCancelButton} 
              onPress={onClose}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
           
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmModal; 