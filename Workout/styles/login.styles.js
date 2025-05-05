import { StyleSheet, Dimensions } from 'react-native';
import colors from '../constants/colors';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import components from '../constants/components';
import layout from '../constants/layout';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  // reuse the layout container
  container: {
    ...layout.screenCenter,
    paddingHorizontal: Spacing.m,
  },

  title: {
    fontSize: FontSize.large,
    fontWeight: '700',
    color: colors.textWhite,
    marginBottom: Spacing.xl,
  },

  inputContainer: {
    width: '100%',
  },

  inputLabel: {
    color: colors.textLight,
    fontSize: FontSize.small,
    marginBottom: Spacing.xs,
  },

  // reuse the input variant
  textInput: {
    ...components.input,
  },

  // base button + primary variant
  button: {
    ...components.button,
    ...components.buttonPrimary,
    width: '100%',
  },

  buttonText: {
    ...components.buttonText,
  },

  googleButton: {
    ...components.button,
    ...components.buttonOutline,
    flexDirection: 'row',
    width: '100%',
  },

  googleIcon: {
    marginRight: Spacing.s,
  },

  googleText: {
    ...components.buttonText,
  },

  footerText: {
    color: colors.footerText,
    fontSize: FontSize.small,
    marginTop: Spacing.l,
  },
});