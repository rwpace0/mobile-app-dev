import React, { useState, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../API/auth/authContext";
import { createStyles } from "../styles/login.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import AlertModal from "../components/modals/AlertModal";
import { useAlertModal } from "../utils/useAlertModal";

const ResetPassword = ({ navigation, route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("request"); // "request" or "reset"
  const [token_hash, setToken_hash] = useState("");
  const [type, setType] = useState("");
  
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { requestPasswordReset, resetPasswordWithToken } = useAuth();
  const { alertState, showError, showSuccess, hideAlert } = useAlertModal();

  // Check if we have token parameters from deep link
  React.useEffect(() => {
    if (route.params?.token_hash && route.params?.type) {
      setToken_hash(route.params.token_hash);
      setType(route.params.type);
      setStep("reset");
    }
  }, [route.params]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const passwordRequirements = useMemo(() => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return [
      { met: minLength, text: "At least 8 characters" },
      { met: hasUpperCase, text: "At least one uppercase letter" },
      { met: hasLowerCase, text: "At least one lowercase letter" },
      { met: hasNumbers, text: "At least one number" },
      { met: hasSpecialChar, text: "At least one special character" },
    ];
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return passwordRequirements.every((req) => req.met);
  }, [passwordRequirements]);

  const passwordStrength = useMemo(() => {
    const metRequirements = passwordRequirements.filter(
      (req) => req.met
    ).length;
    return (metRequirements / passwordRequirements.length) * 100;
  }, [passwordRequirements]);

  const passwordsMatch = password === confirmPassword;

  const canSubmitRequest = email && validateEmail(email) && !loading;
  const canSubmitReset = isPasswordValid && passwordsMatch && !loading;

  const handleRequestReset = async () => {
    if (!email) {
      showError("Error", "Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      showError("Error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email);
      showSuccess(
        "Email Sent",
        "Password reset email sent successfully. Please check your email and click the reset link.",
        {
          onConfirm: () => navigation.navigate("Login"),
        }
      );
    } catch (error) {
      showError("Error", error.message || "Failed to send password reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      showError("Error", "Please meet all password requirements");
      return;
    }

    if (!passwordsMatch) {
      showError("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithToken(token_hash, type, password);
      showSuccess(
        "Success",
        "Password reset successfully! You are now logged in.",
        {
          onConfirm: () => navigation.navigate("Start"),
        }
      );
    } catch (error) {
      showError("Error", error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const renderRequestStep = () => (
    <>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a link to reset your password.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!canSubmitRequest || loading) && styles.buttonDisabled]}
        activeOpacity={0.8}
        onPress={handleRequestReset}
        disabled={!canSubmitRequest || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Reset Email"}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderResetStep = () => (
    <>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>
        Enter your new password below.
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your new password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
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
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={[
            styles.textInput,
            confirmPassword && !passwordsMatch ? styles.textInputError : null,
          ]}
          placeholder="Confirm your new password"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />
        {confirmPassword && !passwordsMatch && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, (!canSubmitReset || loading) && styles.buttonDisabled]}
        activeOpacity={0.8}
        onPress={handleResetPassword}
        disabled={!canSubmitReset || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Resetting..." : "Reset Password"}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {step === "request" ? renderRequestStep() : renderResetStep()}

      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        disabled={loading}
      >
        <Text style={styles.textFooter}>Back to Login</Text>
      </TouchableOpacity>

      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </ScrollView>
  );
};

export default ResetPassword;
