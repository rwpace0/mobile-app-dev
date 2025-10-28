import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

const FolderModal = ({
  visible,
  onClose,
  onSave,
  initialName = "",
  mode = "create",
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [folderName, setFolderName] = useState(initialName);

  useEffect(() => {
    if (visible) {
      setFolderName(initialName);
    }
  }, [visible, initialName]);

  const handleSave = () => {
    const trimmedName = folderName.trim();
    if (trimmedName) {
      onSave(trimmedName);
      setFolderName("");
      onClose();
    }
  };

  const handleCancel = () => {
    setFolderName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centerModalContainer}
      >
        <View style={styles.deleteModalContent}>
          <Text style={styles.deleteModalText}>
            {mode === "create" ? "Create New Folder" : "Rename Folder"}
          </Text>
          <TextInput
            style={styles.folderInput}
            value={folderName}
            onChangeText={setFolderName}
            placeholder="Folder name"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            maxLength={50}
          />
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={styles.primaryModalButton}
              onPress={handleSave}
            >
              <Text style={styles.primaryModalButtonText}>
                {mode === "create" ? "Create" : "Save"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteModalCancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FolderModal;
