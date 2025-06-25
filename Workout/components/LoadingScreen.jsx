import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { getColors } from '../constants/colors';
import { useTheme } from '../constants/ThemeContext';

const LoadingScreen = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
      <ActivityIndicator size="large" color={colors.primaryBlue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default LoadingScreen;
