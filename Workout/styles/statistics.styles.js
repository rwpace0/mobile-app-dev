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

    // Overview Stats Card
    overviewCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
      overflow: "hidden",
      ...Shadow.small,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    statItem: {
      width: "50%",
      paddingVertical: Spacing.l,
      paddingHorizontal: Spacing.m,
      alignItems: "center",
      justifyContent: "center",
    },
    statItemBorderRight: {
      borderRightWidth: 1,
      borderRightColor: colors.borderColor,
    },
    statItemBorderBottom: {
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    statValue: {
      fontSize: 32,
      fontWeight: FontWeight.bold,
      color: colors.primaryBlue,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
    },

    // Period Selector Section
    periodSelectorContainer: {
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
    },

    // Unified Chart Section
    chartSection: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
      ...Shadow.small,
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

    // Top Exercises List
    exerciseList: {
      paddingHorizontal: Spacing.m,
    },
    exerciseItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    exerciseItemLast: {
      borderBottomWidth: 0,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xxs,
    },
    exerciseMuscle: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
    },
    exerciseStats: {
      alignItems: "flex-end",
    },
    exerciseVolume: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.primaryBlue,
    },
    exerciseCount: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
    },
  });
};
