import { StyleSheet } from 'react-native';
import { Spacing } from './theme';
import colors from './colors';

export default StyleSheet.create({
  screenCenter: {
    flex: 1,
    paddingHorizontal: Spacing.m,
    backgroundColor: colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});