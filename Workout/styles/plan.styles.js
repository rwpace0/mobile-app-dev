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

    content: {
      flex: 1,
      paddingHorizontal: Spacing.m,
      paddingBottom: Spacing.xl,
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
      marginBottom: Spacing.s,
    },

    // Calendar Section
    calendarSection: {
      marginTop: Spacing.m,
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.m,
      ...Shadow.medium,
    },

    calendarTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.m,
    },

    // Empty State
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxl,
    },

    emptyStateText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      textAlign: "center",
      marginBottom: Spacing.l,
      lineHeight: 24,
    },

    createPlanButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      ...Shadow.medium,
    },

    createPlanButtonText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },

    // Template Cards (reuse from start screen style)
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
      marginBottom: Spacing.m,
    },

    templateName: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.bold,
      flex: 1,
    },

    templateCount: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.normal,
    },

    exerciseList: {
      gap: Spacing.s,
    },

    exerciseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.s,
    },

    exerciseName: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      flex: 1,
      marginRight: Spacing.s,
    },

    exerciseSets: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
    },

    templateExercises: {
      color: colors.textSecondary,
      fontSize: FontSize.small,
      marginBottom: Spacing.m,
    },

    assignButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.sm,
      alignItems: "center",
    },

    assignButtonText: {
      color: colors.textWhite,
      fontSize: FontSize.small,
      fontWeight: FontWeight.semiBold,
    },

    // New Routine Button
    newRoutineButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },

    newRoutineText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
    },

    // Volume Stats Section
    volumeSection: {
      marginTop: Spacing.m,
    },

    // Loading State
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xxl,
    },

    // Modal styles for day selection
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },

    modalContainer: {
      backgroundColor: colors.backgroundCard,
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      paddingTop: Spacing.l,
      paddingBottom: Spacing.xl,
      maxHeight: "70%",
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      paddingBottom: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    modalTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
    },

    modalContent: {
      paddingHorizontal: Spacing.m,
    },

    modalTemplateItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "30",
    },

    modalTemplateName: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      flex: 1,
    },

    restDayButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      marginVertical: Spacing.m,
      marginHorizontal: Spacing.m,
    },

    restDayButtonText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },
  });
};
