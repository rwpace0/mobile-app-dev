import React, { useState, useMemo } from "react";
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
import { authAPI } from "../../../API/auth/authAPI";
import { useAlertModal } from "../../../utils/useAlertModal";
import AlertModal from "../../../components/modals/AlertModal";
import { Ionicons } from "@expo/vector-icons";

const AccountFormField = ({ title, value, onChangeText, placeholder, secureTextEntry = false, editable = true, error = false }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  return (
    <View style={styles.formField}>
      <Text style={styles.formFieldLabel}>{title}</Text>
      <TextInput
        style={[styles.formFieldInput, error && styles.formFieldInputError]}
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

const ChangePassword = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { alertState, showSuccess, showError, hideAlert } = useAlertModal();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Check password matching in real-time
    if (field === 'newPassword') {
      // When new password changes, check if it matches confirm password
      if (value && formData.confirmPassword) {
        const match = value === formData.confirmPassword;
        setPasswordsMatch(match);
        setConfirmPasswordError(!match);
      } else {
        setPasswordsMatch(true);
        setConfirmPasswordError(false);
      }
    } else if (field === 'confirmPassword') {
      // When confirm password changes, check if it matches new password
      if (value && formData.newPassword) {
        const match = value === formData.newPassword;
        setPasswordsMatch(match);
        setConfirmPasswordError(!match);
      } else {
        setPasswordsMatch(true);
        setConfirmPasswordError(false);
      }
    }
  };

  const passwordRequirements = useMemo(() => {
    const minLength = formData.newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasNumbers = /\d/.test(formData.newPassword);

    return [
      { met: minLength, text: "At least 8 characters" },
      { met: hasUpperCase, text: "At least one uppercase letter" },
      { met: hasNumbers, text: "At least one number" },
    ];
  }, [formData.newPassword]);

  const isPasswordValid = useMemo(() => {
    return passwordRequirements.every((req) => req.met);
  }, [passwordRequirements]);

  const passwordStrength = useMemo(() => {
    const metRequirements = passwordRequirements.filter(
      (req) => req.met
    ).length;
    return (metRequirements / passwordRequirements.length) * 100;
  }, [passwordRequirements]);

  const validateForm = () => {
    if (!formData.newPassword.trim()) {
      showError("Error", "New password is required");
      return false;
    }

    if (!formData.confirmPassword.trim()) {
      showError("Error", "Password confirmation is required");
      return false;
    }

    if (!passwordsMatch) {
      showError("Error", "Passwords do not match");
      return false;
    }

    if (!isPasswordValid) {
      showError("Error", "Please meet all password requirements");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(
        formData.newPassword,
        formData.confirmPassword
      );
      showSuccess("Success", "Password changed successfully", {
        onConfirm: () => {
          hideAlert();
          navigation.goBack();
        }
      });
    } catch (error) {
      // Customize error message for display
      let errorMessage = error.error || error.message || "Failed to change password";
      showError("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Change Password" leftComponent={{ type: "back" }} />
      <ScrollView style={styles.scrollView}>
        <AccountFormField
          title="New Password"
          value={formData.newPassword}
          onChangeText={(value) => handleFormChange('newPassword', value)}
          placeholder="Enter new password"
          secureTextEntry={true}
        />

        <View style={styles.passwordRequirementsContainer}>
          <View style={styles.strengthBarContainer}>
            <View
              style={[styles.strengthBar, { width: `${passwordStrength}%` }]}
            />
          </View>

          {passwordRequirements.map((requirement, index) => (
            <View key={index} style={styles.requirementItem}>
              <Ionicons
                name={requirement.met ? "checkmark-circle" : "close-circle"}
                size={20}
                color={
                  requirement.met ? colors.accentGreen : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  requirement.met
                    ? styles.requirementMet
                    : styles.requirementUnmet,
                ]}
              >
                {requirement.text}
              </Text>
            </View>
          ))}
        </View>

        <AccountFormField
          title="Confirm New Password"
          value={formData.confirmPassword}
          onChangeText={(value) => handleFormChange('confirmPassword', value)}
          placeholder="Confirm new password"
          secureTextEntry={true}
          error={confirmPasswordError}
        />
        {confirmPasswordError && formData.confirmPassword && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}

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

export default ChangePassword;