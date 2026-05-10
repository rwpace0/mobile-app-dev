import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";
import { createListGroupStyleSheet } from "./listGroup.styles";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  const lg = createListGroupStyleSheet(colors);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: Spacing.xxxl,
      paddingBottom: Spacing.l,
      paddingHorizontal: Spacing.m,
    },
    backButton: {
      marginRight: Spacing.m,
    },
    headerTitle: {
      fontSize: FontSize.xxlarge,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    sectionHeader: lg.listSectionTitle,
    settingsGroup: lg.listGroup,
    settingsItem: lg.listRow,
    settingsItemBorder: lg.listRowBorder,
    settingsItemLeft: lg.listRowLeft,
    settingsIconWrap: lg.listIconWrap,
    settingsItemText: lg.listRowTitle,

    dropdownValue: {
      flexDirection: "row",
      alignItems: "center",
    },
    dropdownValueText: {
      fontSize: FontSize.base,
      color: colors.textFaded,
      marginRight: Spacing.xs,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.overlayDark,
    },
    modalContent: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.l,
      minWidth: 300,
      maxWidth: "80%",
    },
    modalTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.l,
      textAlign: "center",
    },
    dropdownOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.s,
      borderRadius: BorderRadius.md,
    },
    dropdownOptionSelected: {
      backgroundColor: colors.borderColor,
    },
    dropdownOptionText: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
    },
    dropdownOptionTextSelected: {
      color: colors.primaryBlue,
      fontWeight: FontWeight.medium,
    },
    modalCloseButton: {
      marginTop: Spacing.l,
      paddingVertical: Spacing.m,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.borderColor,
    },
    modalCloseText: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
      textAlign: "center",
      fontWeight: FontWeight.medium,
    },
    formField: {
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.m,
    },
    formFieldLabel: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginBottom: Spacing.xs,
    },
    formFieldInput: {
      backgroundColor: colors.backgroundPrimary,
      paddingHorizontal: 0,
      paddingRight: 32,
      paddingVertical: Spacing.m,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
      flex: 1,
    },
    inputContainer: {
      position: "relative",
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
    },
    clearButton: {
      position: "absolute",
      right: 0,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.xs,
      paddingVertical: Spacing.m,
    },
    passwordInputContainer: {
      position: "relative",
      width: "100%",
      justifyContent: "center",
    },
    passwordInput: {
      paddingRight: 80,
    },
    passwordIconsContainer: {
      position: "absolute",
      right: 0,
      height: "100%",
      flexDirection: "row",
      alignItems: "center",
      paddingRight: Spacing.xs,
    },
    eyeIcon: {
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: Spacing.m,
    },
    // Segmented Control styles
    unitSection: {
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
    },
    unitSectionTitle: {
      fontSize: FontSize.base,
      color: colors.textFaded,
      marginBottom: Spacing.s,
      fontWeight: FontWeight.medium,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: 2,
      marginBottom: Spacing.s,
    },
    segmentedOption: {
      flex: 1,
      paddingVertical: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentedOptionActive: {
      backgroundColor: colors.primaryBlue,
    },
    segmentedOptionInactive: {
      backgroundColor: "transparent",
    },
    segmentedOptionText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
    },
    segmentedOptionTextActive: {
      color: "#FFFFFF",
    },
    segmentedOptionTextInactive: {
      color: colors.textSecondary,
    },

    // Password requirements styles
    passwordRequirementsContainer: {
      marginTop: Spacing.s,
      paddingHorizontal: Spacing.m,
    },
    requirementItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },
    requirementText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      marginLeft: Spacing.xs,
    },
    requirementMet: {
      color: colors.accentGreen,
    },
    requirementUnmet: {
      color: colors.textSecondary,
    },
    strengthBarContainer: {
      height: 4,
      backgroundColor: colors.textSecondary,
      borderRadius: BorderRadius.small,
      marginBottom: Spacing.l,
    },
    strengthBar: {
      height: "100%",
      borderRadius: BorderRadius.small,
      backgroundColor: colors.accentGreen,
    },
    errorText: {
      color: colors.accentRed,
      fontSize: FontSize.small,
      marginBottom: Spacing.s,
      paddingHorizontal: Spacing.m,
    },
    formFieldInputError: {
      borderBottomColor: colors.accentRed,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: lg.listScrollContentPadding,
  });
};

// Default export for backward compatibility
export default createStyles(true);
