import { StyleSheet } from 'react-native';
import { Spacing } from './theme';
import { getColors } from './colors';

export const createLayoutStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
    screenCenter: {
      flex: 1,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

// Default export for backward compatibility
export default createLayoutStyles(true);