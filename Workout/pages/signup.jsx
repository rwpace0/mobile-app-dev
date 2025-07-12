import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "../API/auth/authContext";
import { authAPI } from "../API/auth/authAPI";
import { createStyles } from "../styles/login.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash/debounce";
import AlertModal from "../components/modals/AlertModal";
import { useAlertModal } from "../utils/useAlertModal";

const SignUpPage = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [emailError, setEmailError] = useState(false);
  const [emailAvailabilityError, setEmailAvailabilityError] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(true);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { signup, error } = useAuth();
  const { alertState, showError, showSuccess, hideAlert } = useAlertModal();

  // Debounced availability check
  const checkAvailability = useCallback(
    debounce(async (username) => {
      if (!username || !validateUsername(username)) return;

      setIsCheckingUsername(true);
      try {
        const result = await authAPI.checkAvailability(username, "");
        setIsUsernameAvailable(result.available);
        setAvailabilityError(
          result.available ? "" : "Username is already taken"
        );
      } catch (error) {
        console.error("Availability check failed:", error);
        setAvailabilityError("Failed to check username availability");
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 800),
    []
  );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    // Username should be 3-20 characters, alphanumeric with underscores and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    setIsUsernameAvailable(true); // Reset availability while typing
    setAvailabilityError(""); // Clear any previous errors

    if (text && !validateUsername(text)) {
      setUsernameError(true);
    } else {
      setUsernameError(false);
      checkAvailability(text);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailAvailabilityError(""); // Clear availability error when typing
    if (text && !validateEmail(text)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
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

  const canSubmit = useMemo(() => {
    return (
      isPasswordValid &&
      !loading &&
      isUsernameAvailable &&
      !isCheckingUsername &&
      !usernameError &&
      username.length > 0
    );
  }, [
    isPasswordValid,
    loading,
    isUsernameAvailable,
    isCheckingUsername,
    usernameError,
    username,
  ]);

  const handleSignup = async () => {
    if (!email || !password || !username) {
      showError("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(true);
      showError("Error", "Please enter a valid email address");
      return;
    }

    if (!validateUsername(username)) {
      setUsernameError(true);
      showError(
        "Error",
        "Username must be 3-20 characters and can only contain letters, numbers, underscores, and hyphens"
      );
      return;
    }

    if (!isUsernameAvailable || isCheckingUsername) {
      showError("Error", "Please choose a different username");
      return;
    }

    if (!isPasswordValid) {
      showError("Error", "Please meet all password requirements");
      return;
    }

    try {
      setLoading(true);
      // Check email availability right before signup
      const emailCheck = await authAPI.checkAvailability("", email);
      if (!emailCheck.available) {
        setEmailAvailabilityError("Email is already registered");
        setLoading(false);
        return;
      }

      const result = await signup(email, password, username);
      showSuccess(
        "Success",
        "Registration successful! Please check your email to verify your account.",
        {
          onConfirm: () => navigation.navigate("Login"),
        }
      );
    } catch (error) {
      showError("Error", error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={[
            styles.textInput,
            usernameError || !isUsernameAvailable
              ? styles.textInputError
              : null,
          ]}
          placeholder="Choose a username (3-20 characters)"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          value={username}
          onChangeText={handleUsernameChange}
          editable={!loading}
        />
        {usernameError ? (
          <Text style={styles.errorText}>
            Username must be 3-20 characters and can only contain letters,
            numbers, underscores, and hyphens
          </Text>
        ) : !isUsernameAvailable ? (
          <Text style={styles.errorText}>{availabilityError}</Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[
            styles.textInput,
            emailError || emailAvailabilityError
              ? styles.textInputError
              : null,
          ]}
          placeholder="Enter your email"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={handleEmailChange}
          editable={!loading}
        />
        {emailError ? (
          <Text style={styles.errorText}>Invalid email format</Text>
        ) : emailAvailabilityError ? (
          <Text style={styles.errorText}>{emailAvailabilityError}</Text>
        ) : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your password"
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
                color={requirement.met ? colors.accentGreen : colors.textSecondary}
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

      <TouchableOpacity
        style={[
          styles.button,
          (!canSubmit || loading) && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
        onPress={handleSignup}
        disabled={!canSubmit || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing up..." : "Sign Up"}
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
        onPress={() => navigation.navigate("Login")}
        disabled={loading}
      >
        <Text style={styles.textFooter}>
          Already have an account? {""}
          <Text style={styles.bluetextFooter}>Log in</Text>
        </Text>
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

export default SignUpPage;
