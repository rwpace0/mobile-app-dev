import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createStyles } from "../styles/login.styles";
import { useTheme } from "../state/SettingsContext";
import { Button } from "../components/ui/Button";

const WelcomePage = ({ navigation }) => {
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Workout</Text>
      <Text style={styles.subtitle}>subtitle</Text>

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          title="Sign Up"
          onPress={() => navigation.navigate("SignUp")}
          style={{ width: "100%" }}
        />

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
