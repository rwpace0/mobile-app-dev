import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useAuth } from "../API/AuthContext";
import styles from "../styles/login.styles";
import { Ionicons } from "@expo/vector-icons";
import colors from "../constants/colors";

const SignUpPage = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, error } = useAuth();

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

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert("Error", "Please meet all password requirements");
      return;
    }

    try {
      setLoading(true);
      const result = await signup(email, password);
      Alert.alert(
        "Success",
        "Registration successful! Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your password"
          placeholderTextColor="#999999"
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
                size={16}
                color={requirement.met ? "#4CAF50" : colors.textLight}
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
          (!isPasswordValid || loading) && styles.buttonDisabled,
        ]}
        activeOpacity={0.8}
        onPress={handleSignup}
        disabled={!isPasswordValid || loading}
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
        <Text style={styles.footerText}>
          Already have an account? {""}
          <Text style={styles.blueFooterText}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpPage;
