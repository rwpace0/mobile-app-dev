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
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.m,
      overflow: "hidden",
      ...Shadow.medium,
    },

    exerciseImage: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },

    // Info cards styles
    infoCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      flexDirection: "row",
      alignItems: "center",
      ...Shadow.small,
    },

    infoIcon: {
      marginRight: Spacing.m,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      marginBottom: Spacing.xxs,
    },

    infoText: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
    },

    // Summary tab styles
    instructionContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },

    instructionLabel: {
      fontSize: FontSize.medium,
      color: colors.textSecondary,
      marginBottom: Spacing.s,
    },

    instructionText: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
      lineHeight: 24,
    },

    // History tab styles
    workoutContainer: {
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
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
      flex: 1,
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.m,
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
  });
};

// Default export for backward compatibility
export default createStyles(true);
