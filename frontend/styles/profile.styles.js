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

    profileSection: {
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.m,
      paddingHorizontal: Spacing.m,
    },

    avatarContainer: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },

    avatarRing: {
      padding: 3,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: isDark
        ? "rgba(64, 156, 255, 0.45)"
        : "rgba(0, 122, 255, 0.35)",
      marginBottom: Spacing.m,
      ...Shadow.small,
    },

    avatar: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },

    avatarImage: {
      width: 104,
      height: 104,
      borderRadius: 52,
    },

    displayName: {
      color: colors.textPrimary,
      fontSize: FontSize.xxlarge,
      fontWeight: FontWeight.bold,
      marginBottom: Spacing.xxs,
      letterSpacing: -0.5,
      textAlign: "center",
    },

    username: {
      color: colors.textFaded,
      fontSize: FontSize.caption,
      fontWeight: FontWeight.regular,
      textAlign: "center",
      maxWidth: "92%",
    },

    statsCard: {
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderColor,
      paddingVertical: Spacing.l,
      paddingHorizontal: Spacing.xs,
      overflow: "hidden",
    },

    statCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xxs,
    },

    statDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.borderColor,
      marginVertical: Spacing.xs,
      opacity: 0.85,
    },

    statIconWrap: {
      marginBottom: Spacing.xs,
    },

    statValue: {
      color: colors.textPrimary,
      fontSize: FontSize.xlarge,
      fontWeight: FontWeight.bold,
      marginBottom: Spacing.xxs,
    },

    statLabel: {
      color: colors.textFaded,
      fontSize: FontSize.tiny,
      fontWeight: FontWeight.semiBold,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      textAlign: "center",
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
      marginTop: 0,
    },

    dashboardTitle: {
      color: colors.textFaded,
      fontSize: FontSize.caption,
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.s,
      paddingBottom: Spacing.s,
      fontWeight: FontWeight.semiBold,
      textTransform: "uppercase",
      letterSpacing: 1,
    },

    dashboardList: {
      backgroundColor: colors.backgroundSecondary,
      marginHorizontal: Spacing.m,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderColor,
      overflow: "hidden",
    },

    dashboardIconWrap: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
    },

    dashboardItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.m + 2,
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
      flex: 1,
    },

    dashboardItemText: {
      color: colors.textPrimary,
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
    },

    scrollContent: {
      paddingBottom: Spacing.xxxl,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
