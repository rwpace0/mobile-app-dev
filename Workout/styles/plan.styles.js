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
      marginTop: Spacing.xs,
      backgroundColor: "transparent",
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.m,
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
      textAlign: "center",
    },

    // Template Container - Flat design matching workout history/routine detail
    templateContainer: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
    },

    templateDragging: {
      opacity: 0.7,
      ...Shadow.medium,
    },

    templateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.m,
    },

    templateName: {
      color: colors.primaryBlue,
      fontSize: FontSize.large,
      fontWeight: FontWeight.bold,
      flex: 1,
    },

    templateCount: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.normal,
    },

    routineHeader: {
      paddingBottom: Spacing.s,
    },

    routineTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.m,
    },

    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      marginTop: Spacing.s,
    },

    statItemWithIcon: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: Spacing.xl,
    },

    statIconContainer: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.s,
    },

    statText: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
    },

    routineNameSpacer: {
      width: 30,
    },

    routineNameItem: {
      // Additional styling for routine name item if needed
    },

    exerciseList: {
      marginTop: Spacing.s,
    },

    setsHeader: {
      flexDirection: "row",
      paddingHorizontal: Spacing.m,
      paddingBottom: Spacing.xs,
      marginBottom: Spacing.xs,
    },

    setsHeaderText: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
    },

    setHeaderColumn: {
      width: 50,
      textAlign: "center",
    },

    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    exerciseRowEven: {
      backgroundColor: colors.backgroundPrimary,
    },

    exerciseRowOdd: {
      backgroundColor: colors.backgroundCard,
    },

    exerciseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.sm,
    },

    exerciseItemEven: {
      backgroundColor: colors.backgroundCard,
    },

    exerciseItemOdd: {
      backgroundColor: colors.backgroundPrimary,
    },

    exerciseNumber: {
      width: 50,
      fontSize: FontSize.base,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
      textAlign: "center",
    },

    exerciseName: {
      flex: 1,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.m,
    },

    exerciseSets: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
      width: 50,
      textAlign: "center",
    },

    bestSetColumn: {
      width: 50,
      textAlign: "center",
    },

    moreExercisesText: {
      color: colors.textSecondary,
      fontSize: FontSize.small,
      fontStyle: "italic",
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.xs,
    },

    exerciseListContainer: {
      marginTop: Spacing.s,
    },

    templateExercises: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
      marginBottom: Spacing.m,
      lineHeight: 22,
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
      textAlign: "center",
    },

    // New Routine Button
    newRoutineButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.l,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.l,
      ...Shadow.small,
    },

    newRoutineText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
    },

    // Volume Stats Section
    volumeSection: {
      marginTop: Spacing.l,
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
      textAlign: "center",
    },
  });
};
