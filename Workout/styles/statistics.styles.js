import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from "../constants/theme";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    scrollContent: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl,
    },
    errorText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.m,
    },
    retryButton: {
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.l,
      backgroundColor: colors.primaryBlue,
      borderRadius: BorderRadius.md,
    },
    retryText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textWhite,
    },

    // Period Selector Section
    periodSelectorContainer: {
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
    },

    // Unified Chart Section
    chartSection: {
      backgroundColor: colors.backgroundPrimary,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      marginBottom: Spacing.m,
    },
    chartTitle: {
      fontSize: FontSize.xlarge,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
    },
    chartDescription: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.m,
    },
    swipeableContainer: {
      marginBottom: Spacing.s,
    },
    swipeablePage: {
      paddingHorizontal: Spacing.m,
    },
    chartWrapper: {
      minHeight: 220,
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    paginationContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: Spacing.s,
      marginBottom: Spacing.m,
      gap: Spacing.xs,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.borderColor,
    },
    paginationDotActive: {
      backgroundColor: colors.primaryBlue,
      width: 24,
    },
    emptyChartContainer: {
      height: 180,
      justifyContent: "center",
      alignItems: "center",
    },
    metricSelectorContainer: {
      paddingHorizontal: Spacing.m,
    },

    // Empty State
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl,
      minHeight: 300,
    },
    emptyIcon: {
      marginBottom: Spacing.m,
    },
    emptyTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
      textAlign: "center",
    },
    emptyMessage: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },

    // Statistics Sections
    sectionsContainer: {
      marginTop: Spacing.m,
    },
    sectionsGroup: {
      backgroundColor: colors.backgroundPrimary,
      marginBottom: Spacing.l,
      overflow: "hidden",
    },
    sectionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.l,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundPrimary,
    },
    sectionItemBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderColor,
    },
    sectionLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    sectionIcon: {
      marginRight: Spacing.m,
      width: Spacing.l,
      height: Spacing.l,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: FontSize.medium,
      fontWeight: FontWeight.regular,
      color: colors.textPrimary,
    },

    // Selection Buttons (matching start page button style)
    selectionButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.s,
      paddingBottom: Spacing.m,
      gap: Spacing.m,
    },
    selectionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m, // Same as startRoutineButton
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
    },
    selectionButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    selectionButtonText: {
      fontSize: FontSize.medium, // Same as startRoutineText
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    selectionButtonChevron: {
      marginLeft: Spacing.xs,
    },

    // Chart Date Range Label
    chartDateRange: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: Spacing.xs,
      marginBottom: Spacing.m,
    },

    // Breakdown Section (styled like muscle group list)
    breakdownContainer: {
      backgroundColor: colors.backgroundPrimary,
      marginTop: Spacing.m,
    },
    breakdownHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundPrimary,
    },
    breakdownHeaderText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textSecondary,
    },
    breakdownRow: {
      flexDirection: "column",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundPrimary,
    },
    breakdownRowAlt: {
      backgroundColor: colors.backgroundCard,
    },
    breakdownDateText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.s,
    },
    breakdownMusclesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.s,
    },
    muscleBadgeWrapper: {
      marginBottom: Spacing.xs,
    },
    muscleBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.s,
      borderRadius: BorderRadius.sm,
    },
    muscleBadgeText: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.semiBold,
      marginRight: Spacing.xs,
    },
    muscleBadgeSets: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.bold,
    },
    breakdownNoDataText: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      fontStyle: "italic",
    },

    // Muscle Groups List
    muscleGroupList: {
      backgroundColor: colors.backgroundPrimary,
    },
    muscleGroupItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundPrimary,
    },
    muscleGroupItemAlt: {
      backgroundColor: colors.backgroundCard,
    },
    muscleGroupLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    muscleCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.m,
    },
    muscleCheckboxChecked: {
      backgroundColor: colors.primaryBlue,
    },
    muscleIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: Spacing.m,
    },
    muscleName: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.regular,
      color: colors.textPrimary,
      flex: 1,
    },
    muscleCount: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginLeft: Spacing.m,
    },
  });
};
