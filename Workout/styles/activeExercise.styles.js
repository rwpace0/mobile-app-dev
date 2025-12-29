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
      paddingTop: Spacing.s,
      paddingBottom: Spacing.s,
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.m,
      width: "100%",
    },
    exerciseTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    exerciseIconContainer: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      marginRight: Spacing.s,
    },
    exerciseImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    exerciseName: {
      color: colors.primaryBlue,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      flex: 1,
    },
    exerciseNotes: {
      color: colors.textSecondary,
      fontSize: FontSize.caption,
      marginTop: Spacing.xxs,
      marginBottom: Spacing.xxs,
      paddingHorizontal: Spacing.m,
      width: "100%",
    },
    notesContainer: {
      marginBottom: Spacing.xs,
      marginTop: Spacing.xxs,
      paddingHorizontal: Spacing.m,
    },
    notesInput: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
      width: "100%",
      minHeight: 32,
      fontStyle: "italic",
    },
    deleteButton: {
      marginLeft: Spacing.xs,
      alignItems: "center",
      justifyContent: "center",
    },
    restTimerContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.xxs,
      marginBottom: Spacing.xs,
    },
    restTimerText: {
      color: colors.primaryBlue,
      marginLeft: Spacing.xs,
      fontSize: FontSize.base,
    },
    timerOffText: {
      color: colors.textFaded,
    },
    activeTimerText: {
      color: colors.accentGreen,
    },
    setsContainer: {
      marginTop: Spacing.xs,
    },
    setHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.m,
      marginBottom: Spacing.xs,
    },
    setHeaderCell: {
      color: colors.textFaded,
      fontSize: FontSize.small,
      fontWeight: FontWeight.regular,
      textAlign: "center",
    },
    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
    },
    setRowEven: {
      backgroundColor: colors.backgroundPrimary,
    },
    setRowOdd: {
      backgroundColor: colors.backgroundCard,
    },
    completedSetRow: {
      backgroundColor: colors.completedSetBackground, // Dark green background for completed sets
    },
    warmupSetRow: {
      backgroundColor: colors.warningOverlay,
    },
    setCell: {
      color: colors.textPrimary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.bold,
    },
    setNumberCell: {
      flex: 0.8,
      alignItems: "center",
      justifyContent: "center",
    },
    previousCell: {
      flex: 2.2,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xxs,
    },
    weightHeaderCell: {
      flex: 1.3,
      alignItems: "center",
      justifyContent: "center",
    },
    repsHeaderCell: {
      flex: 1.3,
      alignItems: "center",
      justifyContent: "center",
    },
    weightCell: {
      flexDirection: "row",
      alignItems: "center",
    },
    weightInput: {
      flex: 1,
      paddingHorizontal: Spacing.xs,
      textAlign: "center",
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.bold,
    },
    repsInput: {
      flex: 1,
      paddingHorizontal: Spacing.xs,
      textAlign: "center",
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.bold,
    },
    rirHeaderCell: {
      flex: 1.0,
      alignItems: "center",
      justifyContent: "center",
    },
    rirInput: {
      flex: 1,
      paddingHorizontal: Spacing.xs,
      color: colors.textPrimary,
      textAlign: "center",
      fontSize: FontSize.base,
      fontWeight: FontWeight.bold,
    },
    totalCell: {
      flex: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    completedCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    checkmarkContainer: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.overlayWhiteMedium,
    },
    completedCheckmark: {
      backgroundColor: colors.accentGreen,
    },
    deleteSetButton: {
      marginLeft: "auto",
    },
    addSetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      marginTop: Spacing.xs,
      backgroundColor: colors.backgroundCard,
    },
    addSetText: {
      color: colors.textPrimary,
      marginLeft: Spacing.xs,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
    },
    addExerciseButton: {
      backgroundColor: colors.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.m,
    },
    addExerciseText: {
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      fontSize: FontSize.medium,
    },

    // Rest Timer Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlayMedium,
    },
    modalContent: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      paddingVertical: Spacing.l,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
      marginBottom: Spacing.m,
    },
    presetTimesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      paddingHorizontal: Spacing.m,
    },
    presetTimeButton: {
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      margin: Spacing.xs,
    },
    presetTimeText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
    },
    modalCloseButton: {
      marginTop: Spacing.l,
      paddingVertical: Spacing.s,
      alignItems: "center",
    },
    modalCloseText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
    },
    hiddenItemContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      backgroundColor: colors.accentRed,
      height: "100%",
    },
    hiddenItemLeft: {
      flex: 1,
      backgroundColor: colors.backgroundCard,
    },
    deleteAction: {
      backgroundColor: colors.accentRed,
      justifyContent: "center",
      alignItems: "center",
      width: 75,
      height: "100%",
      paddingHorizontal: 10,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
