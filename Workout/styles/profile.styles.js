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
      paddingVertical: Spacing.l,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    headerTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      flex: 1,
    },

    headerButton: {
      padding: Spacing.xs,
    },

    profileCard: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.l,
      paddingBottom: Spacing.l,
      marginHorizontal: Spacing.m,
      marginTop: Spacing.m,
      borderRadius: BorderRadius.lg,
    },

    avatarContainer: {
      alignItems: "center",
      marginBottom: Spacing.m,
    },

    avatar: {
      width: 100,
      height: 100,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },

    avatarImage: {
      width: 100,
      height: 100,
      borderRadius: BorderRadius.round,
    },

    displayName: {
      color: colors.textPrimary,
      fontSize: FontSize.xlarge,
      fontWeight: FontWeight.bold,
      marginBottom: Spacing.xxs,
    },

    username: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.regular,
    },

    statsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.xl,
    },

    statItem: {
      alignItems: "center",
    },

    statValue: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.bold,
      marginBottom: Spacing.xxs,
    },

    statLabel: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
    },

    graphSection: {
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.l,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },

    graphHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.m,
    },

    timeText: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
    },

    periodText: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
    },

    graphplaceholder: {
      height: 150,
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      justifyContent: "center",
      alignItems: "center",
      ...Shadow.medium,
    },

    toggleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.s,
      marginTop: Spacing.m,
    },

    toggleButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.backgroundCard,
    },

    toggleButtonActive: {
      backgroundColor: colors.primaryBlue,
    },

    toggleText: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
    },

    toggleTextActive: {
      color: colors.textPrimary,
    },

    dashboardSection: {
      marginTop: Spacing.m,
    },

    dashboardTitle: {
      color: colors.textFaded,
      fontSize: FontSize.base,
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.l,
      paddingBottom: Spacing.xs,
      fontWeight: FontWeight.semiBold,
      textTransform: "uppercase",
    },

    dashboardList: {
      backgroundColor: colors.backgroundSecondary,
      marginHorizontal: Spacing.m,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
    },

    dashboardItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundSecondary,
    },

    dashboardItemBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderColor,
    },

    dashboardItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
    },

    dashboardItemText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.regular,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
