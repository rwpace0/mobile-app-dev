import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../API/auth/authContext";
import { createStyles } from "../styles/login.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import AlertModal from "../components/modals/AlertModal";
import { useAlertModal } from "../utils/useAlertModal";
import { hapticLight, hapticMedium } from "../utils/hapticFeedback";

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error } = useAuth();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { alertState, showError, hideAlert } = useAlertModal();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError(false);
    setLoginError(""); // Clear login error when user starts typing
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    setPasswordError(false);
    setLoginError(""); // Clear login error when user starts typing
  };

  const handleLogin = async () => {
    // Reset all errors
    setEmailError(false);
    setPasswordError(false);
    setLoginError("");

    // Validate inputs
    let hasErrors = false;

    if (!email) {
      setEmailError(true);
      hasErrors = true;
    } else if (!validateEmail(email)) {
      setEmailError(true);
      hasErrors = true;
    }

    if (!password) {
      setPasswordError(true);
      hasErrors = true;
    }

    if (hasErrors) {
      showError("Error", "Please fill in all fields correctly");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      // navigation will be handled by the auth state change
    } catch (error) {
      const errorMessage = error.message || "Failed to login";
      setLoginError(errorMessage);

      // Set specific field errors based on the error message
      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("user")
      ) {
        setEmailError(true);
      }
      if (
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("credentials") ||
        errorMessage.toLowerCase().includes("invalid")
      ) {
        setPasswordError(true);
        setLoginError("Invalid password");
      }

      showError("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.textInput, emailError ? styles.textInputError : null]}
          placeholder="Enter your email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={handleEmailChange}
          editable={!loading}
        />
        {emailError && (
          <Text style={styles.errorText}>
            {!email ? "Email is required" : "Invalid email address"}
          </Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              styles.passwordInput,
              passwordError ? styles.textInputError : null,
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={handlePasswordChange}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {passwordError && (
          <Text style={styles.errorText}>
            {!password ? "Password is required" : "Invalid password"}
          </Text>
        )}
      </View>

      {loginError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{loginError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        activeOpacity={0.8}
        onPress={() => {
          hapticMedium();
          handleLogin();
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Log In"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleButton}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          hapticLight();
          navigation.navigate("ResetPassword");
        }}
        disabled={loading}
      >
        <Text style={styles.textFooter}>Forgot your password?</Text>
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
    </View>
  );
};

export default LoginPage;
