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
  // Navbar has: paddingBottom (24) + icon (24) + text (12) + text marginTop (4) + tabItem padding (8*2) + borderTop (1)
  const navbarHeight = Spacing.l + 24 + FontSize.small + Spacing.xxs + (Spacing.xs * 2) + 1; // 24 + 24 + 12 + 4 + 16 + 1 = 81px
  
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: navbarHeight + Spacing.s, // Better spacing above navbar
      left: Spacing.m, // Side margins for centered look
      right: Spacing.m, // Side margins for centered look
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    content: {
      backgroundColor: colors.backgroundCard, // Subtle card background
      paddingVertical: Spacing.xs, // Compact vertical padding
      paddingHorizontal: Spacing.m, // Generous horizontal padding
      borderRadius: BorderRadius.xl, // Pill shape
      minWidth: 120, // Minimum width for timer
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderColor,
      ...Shadow.small, // Subtle shadow for depth
    },
    
    duration: {
      color: colors.primaryBlue,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.semiBold,
      textAlign: 'center',
      letterSpacing: 0.5, // Slight letter spacing for timer readability
    },
  });
};

// Default export for backward compatibility
export default createStyles(true);