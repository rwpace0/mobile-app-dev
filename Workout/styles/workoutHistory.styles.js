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
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },

    // Header styles
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      textAlign: "center",
      flex: 1,
    },
    headerAction: {
      color: colors.primaryLight,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },
    headerButton: {
      padding: Spacing.xs,
    },
    debugButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: BorderRadius.xxl,
      backgroundColor: colors.backgroundSecondary,
    },

    // Workout History Card styles (flat design matching workout/exercise detail)
    workoutCard: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    workoutHeader: {
      paddingBottom: Spacing.s,
    },
    workoutTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.m,
    },
    workoutDate: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      marginBottom: Spacing.s,
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

    // Exercise List styles (summary format)
    exerciseListContainer: {
      marginTop: Spacing.s,
    },
    exerciseRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
    },
    exerciseName: {
      flex: 1,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.m,
    },
    bestSet: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
      width: 140,
      textAlign: "right",
    },
    bestSetColumn: {
      width: 140,
      textAlign: "right",
    },

    // Workout Detail styles
    detailContainer: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      paddingTop: Spacing.m,
    },
    detailHeader: {
      paddingHorizontal: Spacing.m,
      marginTop: Spacing.m,
      marginBottom: Spacing.l,
    },
    detailTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    detailDate: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      marginBottom: Spacing.s,
    },

    // Exercise Container styles (flat, continuous feed design)
    exerciseContainer: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
    },
    exerciseTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.m,
      marginLeft: -Spacing.xs,
      paddingHorizontal: Spacing.m,
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
    exerciseCardTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.primaryBlue,
      flex: 1,
    },
    exerciseNotes: {
      fontSize: FontSize.medium,
      color: colors.textSecondary,
      marginBottom: Spacing.m,
      fontStyle: "italic",
      paddingHorizontal: Spacing.m,
    },

    // Set styles (flat, continuous feed design)
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
      flex: 1,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.m,
    },
    setRir: {
      width: 70,
      fontSize: FontSize.base,
      color: colors.textSecondary,
      textAlign: "center",
    },

    // Loading and Error states
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.backgroundPrimary,
    },
    errorText: {
      fontSize: FontSize.large,
      color: colors.accentRed,
      textAlign: "center",
    },

    loadingMore: {
      paddingVertical: Spacing.l,
      alignItems: "center",
      justifyContent: "center",
    },

    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.l,
    },

    retryButton: {
      marginTop: Spacing.m,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.l,
      backgroundColor: colors.primaryBlue,
      borderRadius: BorderRadius.md,
    },

    retryText: {
      color: colors.textWhite,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
    },

    footerRetry: {
      paddingVertical: Spacing.m,
      alignItems: "center",
    },

    footerRetryText: {
      color: colors.primaryBlue,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: "center",
    },

    emptyText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      textAlign: "center",
    },

    retryingText: {
      marginTop: Spacing.xs,
      color: colors.textSecondary,
      fontSize: FontSize.caption,
    },

    // Start Routine Button
    startRoutineButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
    },
    startRoutineText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
