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

const VIEW_MODES = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const ViewModeToggle = ({ selectedMode, onModeChange }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {VIEW_MODES.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.button,
            selectedMode === mode.id && styles.buttonSelected,
          ]}
          onPress={() => onModeChange(mode.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.buttonText,
              selectedMode === mode.id && styles.buttonTextSelected,
            ]}
          >
            {mode.label}
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
      borderRadius: BorderRadius.lg,
      padding: Spacing.xxs,
      alignSelf: "flex-end",
    },
    button: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 70,
    },
    buttonSelected: {
      backgroundColor: colors.primaryBlue,
    },
    buttonText: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
    },
    buttonTextSelected: {
      color: colors.textPrimary,
      fontWeight: FontWeight.semiBold,
    },
  });

export default ViewModeToggle;
