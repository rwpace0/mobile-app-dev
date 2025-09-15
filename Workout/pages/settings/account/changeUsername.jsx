import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "../../../styles/settings.styles";
import Header from "../../../components/static/header";
import { getColors } from "../../../constants/colors";
import { useTheme } from "../../../state/SettingsContext";
import { useAuth } from "../../../API/auth/authContext";
import { useAlertModal } from "../../../utils/useAlertModal";
import AlertModal from "../../../components/modals/AlertModal";

const AccountFormField = ({ title, value, onChangeText, placeholder, secureTextEntry = false, editable = true }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <View style={styles.formField}>
      <Text style={styles.formFieldLabel}>{title}</Text>
      <TextInput
        style={[styles.formFieldInput, !editable && styles.formFieldInputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaded}
        secureTextEntry={secureTextEntry}
        editable={editable}
      />
    </View>
  );
};

const ChangeUsername = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { user, changeUsername } = useAuth();
  const { alertState, showSuccess, showError, hideAlert } = useAlertModal();

  const [formData, setFormData] = useState({
    newUsername: '',
  });
  const [loading, setLoading] = useState(false);

  // Set current username from user data
  useEffect(() => {
    if (user?.username) {
      setFormData(prev => ({
        ...prev,
        currentUsername: user.username
      }));
    }
  }, [user]);

  const handleFormChange = (field, value) => {
    // Convert username to lowercase
    const processedValue = field === 'newUsername' ? value.toLowerCase() : value;
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const validateUsername = (username) => {
    if (!username.trim()) {
      return "Username is required";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (username.length > 20) {
      return "Username must be less than 20 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return "Username can only contain letters, numbers, underscores, and hyphens";
    }
    if (username === user?.username) {
      return "New username must be different from current username";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateUsername(formData.newUsername);
    if (validationError) {
      showError("Invalid Username", validationError);
      return;
    }

    setLoading(true);
    try {
      await changeUsername(formData.newUsername);
      showSuccess("Success", "Username changed successfully", {
        onConfirm: () => {
          hideAlert();
          navigation.goBack();
        }
      });
    } catch (error) {
      // Customize error message for display
      let errorMessage = error.error || error.message || "Failed to change username";
      if (errorMessage.includes("already in use")) {
        errorMessage = "Username is unavailable";
      }
      showError("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Change Username" leftComponent={{ type: "back" }} />
      <ScrollView style={styles.scrollView}>
        <AccountFormField
          title="New Username"
          value={formData.newUsername}
          onChangeText={(value) => handleFormChange('newUsername', value)}
          placeholder="Enter new username"
        />
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        message={alertState.message}
        confirmText={alertState.confirmText}
        onConfirm={alertState.onConfirm}
        showCancel={alertState.showCancel}
        cancelText={alertState.cancelText}
        onCancel={alertState.onCancel}
      />
    </SafeAreaView>
  );
};

export default ChangeUsername;
