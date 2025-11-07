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

    // Section styling
    section: {
      marginTop: Spacing.xl,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.m,
    },

    // Name input
    nameInput: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
      ...Shadow.small,
    },

    // Date card
    dateCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
      ...Shadow.small,
    },

    dateCardText: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
    },

    // Add day button
    addDayButton: {
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

    addDayText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
      fontWeight: FontWeight.semiBold,
    },

    // Days list container
    daysListContainer: {
      overflow: "hidden",
    },

    // Day cards
    dayCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      ...Shadow.small,
      overflow: "visible",
    },

    dayCardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    dayCardInfo: {
      flex: 1,
    },

    dayCardLabel: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.xs,
    },

    dayCardTemplate: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
    },

    dayCardTemplateSelected: {
      color: colors.primaryBlue,
      fontWeight: FontWeight.semiBold,
    },

    // Swipe to delete hidden item
    hiddenItemContainer: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "stretch",
      marginBottom: Spacing.m,
    },

    deleteButton: {
      backgroundColor: "#FF3B30",
      justifyContent: "center",
      alignItems: "center",
      width: 75,
      borderTopRightRadius: BorderRadius.md,
      borderBottomRightRadius: BorderRadius.md,
    },

    // Calendar Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
      justifyContent: "center",
      alignItems: "center",
    },

    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    calendarModalContainer: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.xl,
      paddingTop: Spacing.l,
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.m,
      width: "90%",
      maxWidth: 400,
      ...Shadow.large,
    },

    calendarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.m,
      paddingHorizontal: Spacing.s,
    },

    calendarTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
    },

    calendar: {
      backgroundColor: "transparent",
    },

    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
};

export default createStyles(true);
