import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";

/**
 * Single source for all button styles. Keyed by variant for scaling to secondary, danger, etc.
 * @param {boolean} isDark
 * @returns {object} styles.primary, styles.primaryText, styles.primaryDisabled, ...
 */
export const createButtonStyles = (isDark = true) => {
  const colors = getColors(isDark);

  return StyleSheet.create({
    primary: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
    },
    primaryDisabled: {
      opacity: 0.6,
    },
    secondary: {
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
    },
    secondaryDisabled: {
      opacity: 0.6,
    },
    danger: {
      backgroundColor: colors.accentRed,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    dangerText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
    },
    dangerDisabled: {
      opacity: 0.6,
    },
    outline: {
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    outlineText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
    },
    outlineDisabled: {
      opacity: 0.6,
    },
  });
};
