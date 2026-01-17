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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    headerLeft: {
      width: 40,
    },

    headerTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
    },

    headerRight: {
      width: 40,
    },

    tabContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    tab: {
      flex: 1,
      paddingVertical: Spacing.m,
      alignItems: "center",
    },

    tabText: {
      fontSize: FontSize.medium,
      color: colors.textSecondary,
    },

    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primaryLight,
    },

    activeTabText: {
      color: colors.primaryLight,
      fontWeight: FontWeight.semiBold,
    },

    content: {
      flex: 1,
      padding: Spacing.m,
    },

    historyContent: {
      flex: 1,
    },

    // Exercise image styles
    imageContainer: {
      width: "100%",
      height: 250,
      marginBottom: Spacing.l,
      overflow: "hidden",
    },

    exerciseImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    // Summary tab styles - Heavy typography, no cards
    summaryContent: {
      paddingTop: Spacing.xs,
    },

    summaryTitle: {
      fontSize: FontSize.xxlarge,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
      marginBottom: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    muscleGroupSection: {
      marginBottom: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    muscleGroupLabel: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
      marginBottom: Spacing.xs,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    muscleGroupText: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },

    instructionSection: {
      marginTop: Spacing.m,
      marginBottom: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    instructionText: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
      lineHeight: 24,
      fontWeight: FontWeight.regular,
    },

    // History tab styles
    workoutContainer: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    workoutTitle: {
      fontSize: FontSize.large,
      color: colors.textPrimary,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.xxs,
      paddingHorizontal: Spacing.m,
    },

    workoutDate: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      marginBottom: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    setRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    setRowEven: {
      backgroundColor: colors.backgroundPrimary,
    },

    setRowOdd: {
      backgroundColor: colors.backgroundCard,
    },

    setNumber: {
      width: 50,
      fontSize: FontSize.base,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
      textAlign: "center",
    },

    setInfo: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
    },

    setsContainer: {
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

    rirHeaderColumn: {
      width: 70,
      textAlign: "center",
    },

    notes: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      marginTop: Spacing.s,
      fontStyle: "italic",
    },

    emptyHistory: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Spacing.xxl,
    },

    emptyHistoryText: {
      fontSize: FontSize.large,
      color: colors.textSecondary,
      textAlign: "center",
    },

    setRir: {
      width: 70,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      textAlign: "center",
    },

    setIndicator: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.xs,
    },

    setIndicatorIncrease: {
      color: colors.accentGreen,
    },

    setIndicatorDecrease: {
      color: colors.accentRed,
    },

    prIcon: {
      marginLeft: Spacing.xs,
    },

    // Records Rows
    recordsContainer: {
      paddingTop: Spacing.s,
      paddingBottom: Spacing.m,
    },

    recordRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    recordRowLabel: {
      fontSize: FontSize.large,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
    },

    recordRowValue: {
      fontSize: FontSize.large,
      color: colors.primaryBlue,
      fontWeight: FontWeight.semiBold,
    },

    // Progress tab styles
    prCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },

    prTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.m,
    },

    prStats: {
      flexDirection: "row",
      justifyContent: "space-around",
    },

    prStatItem: {
      flex: 1,
      alignItems: "center",
    },

    prValue: {
      fontSize: FontSize.xxlarge,
      fontWeight: FontWeight.bold,
      color: colors.primaryBlue,
      marginBottom: Spacing.xxs,
    },

    prDate: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.accentGreen,
      marginBottom: Spacing.xxs,
    },

    prLabel: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
    },

    periodSelectorContainer: {
      marginBottom: Spacing.m,
    },

    // Progress tab - Sets screen style
    scrollContent: {
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.xl,
    },

    // Selection Buttons
    selectionButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.s,
      paddingBottom: Spacing.m,
    },
    selectionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundCard,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.l,
      borderRadius: BorderRadius.md,
    },
    selectionButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    selectionButtonText: {
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    selectionButtonChevron: {
      marginLeft: Spacing.xs,
    },

    // Chart Section
    chartDescription: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.m,
    },
    chartWrapper: {
      minHeight: 220,
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    chartDateRange: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: Spacing.xs,
      marginBottom: Spacing.m,
    },

    // Metric Selector Buttons
    metricButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.s,
      paddingBottom: Spacing.m,
      gap: Spacing.s,
    },
    metricButton: {
      flex: 1,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.m,
      borderRadius: 999,
      backgroundColor: colors.backgroundCard,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 32,
    },
    metricButtonActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },
    metricButtonText: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
      textAlign: "center",
    },
    metricButtonTextActive: {
      color: colors.textWhite,
      fontWeight: FontWeight.semiBold,
    },

    // Breakdown Section
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    },
    breakdownWeightText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.primaryBlue,
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
  });
};

// Default export for backward compatibility
export default createStyles(true);
