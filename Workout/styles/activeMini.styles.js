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
  
  // Calculate navbar height dynamically
  // Navbar has: paddingVertical (12*2) + icon (24) + text (12) + text marginTop (4) + tabItem padding (8*2)
  const navbarHeight = (Spacing.s * 2) + 24 + FontSize.small + Spacing.xxs + (Spacing.xs * 2) + 4; // ~84px
  
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: navbarHeight, // Position directly above navbar
      left: 0, // Full width - no side margins
      right: 0, // Full width - no side margins
      backgroundColor: colors.backgroundPrimary,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      paddingVertical: Spacing.s, // Increased from Spacing.xs
      paddingHorizontal: Spacing.m, // Increased from Spacing.s
      ...Shadow.medium,
      elevation: 1000, // Ensure it's above other components
      zIndex: 1000,
    },
    
    content: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    workoutName: {
      color: colors.textPrimary,
      fontSize: FontSize.medium, // Increased from FontSize.caption
      fontWeight: FontWeight.semiBold,
      marginBottom: Spacing.xs,
      textAlign: 'center',
      paddingHorizontal: Spacing.s,
    },
    
    buttonSection: {
      flexDirection: 'row',
      gap: Spacing.l, // Increased from Spacing.m
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    
    discardButton: {
      paddingVertical: Spacing.xs, // Increased from Spacing.xxs
      paddingHorizontal: Spacing.m, // Increased from Spacing.s
      minWidth: 90, // Increased from 70
      flex: 1,
      maxWidth: 120, // Increased from 100
    },
    
    discardButtonText: {
      color: colors.accentRed,
      fontSize: FontSize.medium, // Increased from FontSize.small
      
      textAlign: 'center',
    },
    
    resumeButton: {
      paddingVertical: Spacing.xs, // Increased from Spacing.xxs
      paddingHorizontal: Spacing.m, // Increased from Spacing.s
      minWidth: 90, // Increased from 70
      flex: 1,
      maxWidth: 120, // Increased from 100
    },
    
    resumeButtonText: {
      color: colors.primaryBlue,
      fontSize: FontSize.medium, // Increased from FontSize.small
      
      textAlign: 'center',
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);  