import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, FontSize } from './theme';
import colors from './colors';

export default StyleSheet.create({
  input: {
    height: 50,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.s,
    fontSize: FontSize.base,
    backgroundColor: colors.inputBackground,
    color: colors.textWhite,
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
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: colors.textWhite,
  },
  textdefault: {
    color: colors.textWhite,
  },
});