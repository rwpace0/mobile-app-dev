import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, FontSize } from './theme';
import { getColors } from './colors';

export const createComponentStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
    input: {
      height: 50,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.s,
      fontSize: FontSize.base,
      backgroundColor: colors.backgroundInput,
      color: colors.textPrimary,
      marginBottom: Spacing.m,
    },

    // primary button
    button: {
      height: 50,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.s,
    },
    buttonPrimary: {
      backgroundColor: colors.primaryBlue,
    },
    buttonOutline: {
      backgroundColor: colors.backgroundInput,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
    },
    buttonText: {
      fontSize: FontSize.base,
      fontWeight: '600',
      color: colors.textWhite,
    },
  });
};

// Default export for backward compatibility
export default createComponentStyles(true);