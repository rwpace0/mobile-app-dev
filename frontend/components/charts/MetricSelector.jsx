import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Spacing,
} from "../../constants/theme";

const METRICS = [
  { id: "workouts", label: "Workouts" },
  { id: "duration", label: "Duration" },
  { id: "sets", label: "Sets" },
];

const MetricSelector = ({ selectedMetric, onMetricChange }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {METRICS.map((metric) => (
        <TouchableOpacity
          key={metric.id}
          style={[
            styles.button,
            selectedMetric === metric.id && styles.buttonSelected,
          ]}
          onPress={() => onMetricChange(metric.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              selectedMetric === metric.id && styles.buttonTextSelected,
            ]}
          >
            {metric.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xxs,
      gap: Spacing.xxs,
    },
    button: {
      flex: 1,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonSelected: {
      backgroundColor: colors.primaryBlue,
    },
    buttonText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
    },
    buttonTextSelected: {
      color: colors.textPrimary,
      fontWeight: FontWeight.semiBold,
    },
  });

export default MetricSelector;
