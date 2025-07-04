import { StyleSheet, Dimensions } from "react-native";
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
      position: 'absolute',
      bottom: 100, // Position above navbar (navbar height + margin)
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundPrimary,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      borderBottomColor: colors.borderColor,
      paddingTop: Spacing.s,
      paddingBottom: Spacing.s,
      paddingHorizontal: Spacing.m,
      ...Shadow.medium,
      elevation: 1000, // Ensure it's above other components
      zIndex: 1000,
    },
    
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    
    infoSection: {
      flex: 1,
      marginRight: Spacing.m,
    },
    
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xxs,
    },
    
    title: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      marginLeft: Spacing.xs,
    },
    
    duration: {
      color: colors.textSecondary,
      fontSize: FontSize.small,
      fontWeight: FontWeight.medium,
    },
    
    buttonSection: {
      flexDirection: 'row',
      gap: Spacing.s,
    },
    
    discardButton: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.m,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    
    discardButtonText: {
      color: colors.textSecondary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
      textAlign: 'center',
    },
    
    resumeButton: {
      backgroundColor: colors.primaryLight,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.s,
      paddingHorizontal: Spacing.l,
    },
    
    resumeButtonText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: 'center',
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);  