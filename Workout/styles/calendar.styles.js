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
    // Container styles
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },

    // Calendar container (for vertically scrollable calendar list)
    calendarContainer: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },

    // Calendar theme styling (passed to react-native-calendars)
    calendarTheme: {
      backgroundColor: colors.backgroundPrimary,
      calendarBackground: colors.backgroundPrimary,
      textSectionTitleColor: colors.textSecondary,
      textSectionTitleDisabledColor: colors.textDisabled,
      selectedDayBackgroundColor: colors.primaryBlue,
      selectedDayTextColor: colors.textWhite,
      todayTextColor: colors.textPrimary, // No special today styling
      dayTextColor: colors.textPrimary,
      textDisabledColor: colors.textDisabled,
      dotColor: colors.primaryBlue,
      selectedDotColor: colors.textWhite,
      arrowColor: colors.primaryBlue,
      disabledArrowColor: colors.textDisabled,
      monthTextColor: colors.textPrimary,
      indicatorColor: colors.primaryBlue,
      // Font styling consistent with app
      textDayFontFamily: 'System',
      textMonthFontFamily: 'System',
      textDayHeaderFontFamily: 'System',
      textDayFontWeight: FontWeight.regular,
      textMonthFontWeight: FontWeight.semiBold,
      textDayHeaderFontWeight: FontWeight.medium,
      textDayFontSize: FontSize.base,
      textMonthFontSize: FontSize.large,
      textDayHeaderFontSize: FontSize.caption,
      // Remove extra spacing
      'stylesheet.calendar.header': {
        paddingLeft: 0,
        paddingRight: 0,
        marginTop: Spacing.s,
        marginBottom: Spacing.s,
      },
      'stylesheet.calendar.main': {
        paddingLeft: 0,
        paddingRight: 0,
      },
    },

    // Custom day marking styles
    workoutDayContainer: {
      backgroundColor: colors.primaryBlue,
      borderRadius: BorderRadius.round,
    },

    workoutDayText: {
      color: colors.textWhite,
      fontWeight: FontWeight.semiBold,
    },

    todayContainer: {
      borderColor: colors.primaryLight,
      borderWidth: 2,
      borderRadius: BorderRadius.round,
    },

    selectedDayContainer: {
      backgroundColor: colors.primaryDark,
      borderRadius: BorderRadius.round,
    },

    // Legend section
    legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundCard,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.m,
      borderRadius: BorderRadius.lg,
      ...Shadow.medium,
    },

    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.m,
    },

    legendDot: {
      width: 12,
      height: 12,
      borderRadius: BorderRadius.round,
      marginRight: Spacing.xs,
    },

    legendText: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
    },

    // Workout summary section
    summaryContainer: {
      backgroundColor: colors.backgroundCard,
      marginHorizontal: Spacing.m,
      marginTop: Spacing.m,
      borderRadius: BorderRadius.lg,
      padding: Spacing.m,
      ...Shadow.medium,
    },

    summaryTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.s,
    },

    summaryText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },



    // Empty state
    emptyContainer: {
      backgroundColor: colors.backgroundCard,
      marginHorizontal: Spacing.m,
      marginTop: Spacing.m,
      borderRadius: BorderRadius.lg,
      padding: Spacing.l,
      alignItems: 'center',
      ...Shadow.medium,
    },

    emptyText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.s,
    },

    emptySubtext: {
      fontSize: FontSize.small,
      color: colors.textFaded,
      textAlign: 'center',
    },

    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.backgroundPrimary,
    },

    loadingText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
      marginTop: Spacing.s,
    },

    // Error state
    errorContainer: {
      backgroundColor: colors.backgroundCard,
      marginHorizontal: Spacing.m,
      marginTop: Spacing.m,
      borderRadius: BorderRadius.lg,
      padding: Spacing.l,
      alignItems: 'center',
      ...Shadow.medium,
    },

    errorText: {
      fontSize: FontSize.base,
      color: colors.accentRed,
      textAlign: 'center',
      marginBottom: Spacing.s,
    },

    retryButton: {
      backgroundColor: colors.primaryBlue,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderRadius: BorderRadius.md,
    },

    retryButtonText: {
      color: colors.textWhite,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);
