import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "../../constants/theme";

const PERIODS = [
  { value: "7d", label: "7D" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

const ChartPeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {PERIODS.map((period) => (
        <TouchableOpacity
          key={period.value}
          style={[
            styles.periodButton,
            selectedPeriod === period.value && styles.periodButtonActive,
          ]}
          onPress={() => onPeriodChange(period.value)}
        >
          <Text
            style={[
              styles.periodText,
              selectedPeriod === period.value && styles.periodTextActive,
            ]}
          >
            {period.label}
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
      borderRadius: BorderRadius.md,
      padding: Spacing.xxs,
    },
    periodButton: {
      flex: 1,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    periodButtonActive: {
      backgroundColor: colors.primaryBlue,
    },
    periodText: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
    },
    periodTextActive: {
      color: colors.textWhite,
      fontWeight: FontWeight.semiBold,
    },
  });

export default React.memo(ChartPeriodSelector);
