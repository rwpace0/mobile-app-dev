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

    // Section styling — same vertical step as inner blocks (days list, add day row)
    section: {
      marginTop: Spacing.l,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.m,
    },

    // Name input - matching routine name field (border on row so line runs under text + clear)
    nameInput: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.medium,
      paddingHorizontal: 0,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.xs,
      flex: 1,
      minWidth: 0,
    },
    nameInputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginHorizontal: Spacing.m,
      alignSelf: "stretch",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    nameInputClearButton: {
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xs,
      marginLeft: Spacing.s,
    },

    // Date card
    dateCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
      marginHorizontal: Spacing.m,
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
      marginBottom: Spacing.m,
      ...Shadow.small,
    },

    addDayRow: {
      paddingHorizontal: Spacing.m,
      marginTop: Spacing.l,
    },

    addDayText: {
      color: colors.textWhite,
      fontSize: FontSize.medium,
      marginLeft: Spacing.s,
      fontWeight: FontWeight.semiBold,
    },

    // Add routine button (layout only; Button provides variant styles)
    addRoutineRow: {
      paddingHorizontal: Spacing.m,
    },

    addRoutineButton: {},

    // Days list container
    daysListContainer: {
      overflow: "visible",
      marginTop: Spacing.l,
      paddingHorizontal: Spacing.m,
    },

    // Day cards - Card layout
    dayCard: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      padding: Spacing.m,
      marginBottom: Spacing.m,
      overflow: "visible",
      ...Shadow.small,
    },

    dayCardLast: {
      marginBottom: 0,
    },

    dayCardPressed: {
      backgroundColor: colors.backgroundSecondary,
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
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
      marginBottom: Spacing.xs,
    },

    dayCardTemplate: {
      color: colors.textSecondary,
      fontSize: FontSize.base,
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
      justifyContent: "center",
      alignItems: "center",
      width: 75,
      borderTopRightRadius: BorderRadius.md,
      borderBottomRightRadius: BorderRadius.md,
      // Background from Button variant="danger" (colors.accentRed)
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
      paddingHorizontal: Spacing.m,
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
