import { StyleSheet, Dimensions } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from "../constants/theme";
import { createComponentStyles } from "../constants/components";
import { createLayoutStyles } from "../constants/layout";

const { width } = Dimensions.get("window");

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  const components = createComponentStyles(isDark);
  const layout = createLayoutStyles(isDark);

  return StyleSheet.create({
    container: {
      ...layout.screenCenter,
      paddingHorizontal: Spacing.m,
    },
    title: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
      marginBottom: Spacing.xl,
    },
    subtitle: {
      fontSize: FontSize.medium,
      color: colors.textSecondary,
      marginBottom: Spacing.xxl,
      textAlign: "center",
    },
    buttonContainer: {
      width: "100%",
    },
    button: {
      ...components.button,
      ...components.buttonPrimary,
      width: "100%",
    },
    primaryButton: {
      backgroundColor: colors.primaryBlue,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primaryBlue,
    },
    buttonText: {
      ...components.buttonText,
      textAlign: "center",
    },
    secondaryButtonText: {
      color: colors.primaryBlue,
      textAlign: "center",
    },
    inputContainer: {
      width: "100%",
    },
    inputLabel: {
      color: colors.textSecondary,
      fontSize: FontSize.small,
      marginBottom: Spacing.xs,
    },
    textInput: {
      ...components.input,
    },
    passwordInputContainer: {
      position: "relative",
      width: "100%",
    },
    passwordInput: {
      paddingRight: 50,
    },
    eyeIcon: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: Spacing.m,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 8,
    },
    textInputError: {
      borderColor: colors.accentRed,
      borderWidth: 1,
    },
    googleButton: {
      ...components.button,
      ...components.buttonOutline,
      flexDirection: "row",
      width: "100%",
    },
    googleIcon: {
      marginRight: Spacing.s,
    },
    googleText: {
      fontSize: FontSize.base,
      fontWeight: "600",
      color: colors.primaryBlue,
    },
    textFooter: {
      color: colors.textFooter,
      fontSize: FontSize.small,
      marginTop: Spacing.l,
    },
    bluetextFooter: {
      color: colors.primaryBlue,
      fontSize: FontSize.small,
      marginTop: Spacing.l,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    passwordRequirementsContainer: {
      marginTop: Spacing.s,
      marginBottom: Spacing.m,
      width: "100%",
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
    },
    errorContainer: {
      width: "100%",
      marginBottom: Spacing.m,
    },
    inputWrapper: {
      position: "relative",
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
    },
    inputIndicator: {
      position: "absolute",
      right: Spacing.m,
    },
    bgButton: {
      fontSize: FontSize.base,
      fontWeight: "600",
      color: colors.textWhite,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
