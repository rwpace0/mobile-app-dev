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
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },

    header: {
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    headerTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
    },

    content: {
      flex: 1,
      paddingHorizontal: Spacing.m,
    },

    section: {
      marginTop: Spacing.l,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.s,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
    },

    startEmptyWorkoutButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
    },

    startEmptyWorkoutText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
      textAlign: "center",
    },

    routineActionButtons: {
      flexDirection: "row",
      marginBottom: Spacing.m,
      width: "100%",
    },

    // New Routine CTA
    newRoutineButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      ...Shadow.medium,
    },

    newRoutineText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
      textAlign: "center",
    },

    emptyRoutinesContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      marginTop: Spacing.s,
    },

    emptyRoutinesText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      textAlign: "center",
    },

    // Template list styles
    templateContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },

    templateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },

    templateName: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
    },

    templateExercises: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
      marginBottom: Spacing.m,
      lineHeight: 22,
    },

    startRoutineButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
    },

    startRoutineText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },

    retryButton: {
      marginTop: Spacing.m,
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
    },

    retryText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },

    todayWorkoutContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      ...Shadow.medium,
      borderColor: colors.primaryBlue,
      borderWidth: 1,
    },

    restDayContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      ...Shadow.medium,
    },

    restDayIcon: {
      marginBottom: Spacing.m,
    },

    restDayTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.xs,
    },

    restDayText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      textAlign: "center",
    },

    calendarContainer: {
      backgroundColor: colors.backgroundPrimary,
      borderRadius: BorderRadius.lg,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
