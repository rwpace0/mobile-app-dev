import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "../../../styles/settings.styles";
import Header from "../../../components/static/header";
import { Button } from "../../../components/ui/Button";
import { useThemeColors } from "../../../constants/useThemeColors";
import { useTheme } from "../../../state/SettingsContext";
import { useAuth } from "../../../API/auth/authContext";
import { authAPI } from "../../../API/auth/authAPI";
import { useAlertModal } from "../../../utils/useAlertModal";
import AlertModal from "../../../components/modals/AlertModal";
import { Ionicons } from "@expo/vector-icons";
import AccountFormField from "../../../components/AccountFormField";

const ChangeEmail = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const { user } = useAuth();
  const { alertState, showSuccess, showError, hideAlert } = useAlertModal();

  const [formData, setFormData] = useState({
    newEmail: user?.email || "",
  });
  const [loading, setLoading] = useState(false);

  // Set current email from user data
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        newEmail: user.email,
      }));
    }
  }, [user]);

  const handleFormChange = (field, value) => {
    // Convert email to lowercase
    const processedValue = field === "newEmail" ? value.toLowerCase() : value;
    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    if (email === user?.email) {
      return "New email must be different from current email";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateEmail(formData.newEmail);
    if (validationError) {
      showError("Invalid Email", validationError);
      return;
    }

    setLoading(true);
    try {
      await authAPI.changeEmail(formData.newEmail);
      showSuccess("Success", "Email updated successfully", {
        onConfirm: () => {
          hideAlert();
          navigation.goBack();
        },
      });
    } catch (error) {
      // Customize error message for display
      let errorMessage =
        error.error || error.message || "Failed to change email";
      if (errorMessage.includes("already in use")) {
        errorMessage = "Email is unavailable";
      }
      showError("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Change Email" leftComponent={{ type: "back" }} />
      <ScrollView style={styles.scrollView}>
        <AccountFormField
          title="Email"
          value={formData.newEmail}
          onChangeText={(value) => handleFormChange("newEmail", value)}
          placeholder="Enter new email"
        />
        <Button
          variant="primary"
          title="Save Changes"
          onPress={handleSave}
          disabled={loading}
          loading={loading}
        />
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

export default ChangeEmail;
