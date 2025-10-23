import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";

const FolderDeleteModal = ({
  visible,
  onClose,
  onDeleteFolder,
  onDeleteRoutines,
  folderName,
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
          <Text style={styles.deleteModalText}>Delete "{folderName}"?</Text>
          <Text style={styles.deleteModalSubtext}>Choose what to delete:</Text>
          <View style={styles.folderDeleteButtons}>
            <TouchableOpacity
              style={styles.deleteModalConfirmButton}
              onPress={() => {
                onDeleteRoutines();
                onClose();
              }}
            >
              <Text style={styles.deleteModalConfirmText}>Delete Routines</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.folderDeleteOnlyButton}
              onPress={() => {
                onDeleteFolder();
                onClose();
              }}
            >
              <Text style={styles.folderDeleteOnlyText}>Delete Folder</Text>
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

export default FolderDeleteModal;
