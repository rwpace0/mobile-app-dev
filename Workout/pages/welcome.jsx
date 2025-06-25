import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createStyles } from "../styles/login.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../constants/ThemeContext";

const WelcomePage = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Workout</Text>
      <Text style={styles.subtitle}>subtitle</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.googleText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WelcomePage;
