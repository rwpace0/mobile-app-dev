import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from "../constants/theme";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);

  return StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundCard,
      ...Shadow.large,
      zIndex: 1000,
      paddingBottom: Spacing.xl,
    },
    progressBarContainer: {
      height: 4,
      width: "100%",
      backgroundColor: colors.overlayWhite,
    },
    progressBar: {
      height: "100%",
      backgroundColor: colors.primaryBlue,
    },
    timeContainer: {
      paddingTop: Spacing.l,
      paddingBottom: Spacing.m,
      alignItems: "center",
    },
    timeDisplay: {
      fontSize: 36,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
      letterSpacing: 2,
    },
    controlsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.l,
      paddingBottom: Spacing.m,
      gap: Spacing.m,
    },
    button: {
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.m,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.overlayWhite,
      minWidth: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textSecondary,
    },
    skipButton: {
      backgroundColor: colors.primaryBlue,
    },
    skipButtonText: {
      color: colors.textWhite,
    },
  });
};

export default createStyles(true);
