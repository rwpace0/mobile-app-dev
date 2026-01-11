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
    chartWrapper: {
      minHeight: 180,
      marginBottom: Spacing.m,
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
  });
};
