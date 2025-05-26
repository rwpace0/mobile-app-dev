import { StyleSheet, Dimensions } from 'react-native';
import colors from '../constants/colors';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import components from '../constants/components';
import layout from '../constants/layout';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
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
  subtitle: {
    fontSize: FontSize.medium,
    color: colors.textLight,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.m,
  },
  button: {
    ...components.button,
    ...components.buttonPrimary,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    ...components.buttonText,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    color: colors.textLight,
    fontSize: FontSize.small,
    marginBottom: Spacing.xs,
  },
  textInput: {
    ...components.input,
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
  blueFooterText: {
    color: '#007AFF',
    fontSize: FontSize.small,
    marginTop: Spacing.l,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  passwordRequirementsContainer: {
    marginTop: Spacing.s,
    marginBottom: Spacing.m,
    width: '100%',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  requirementText: {
    color: colors.textLight,
    fontSize: FontSize.small,
    marginLeft: Spacing.xs,
  },
  requirementMet: {
    color: '#4CAF50', // Success green
  },
  requirementUnmet: {
    color: colors.textLight,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: colors.textLight,
    borderRadius: BorderRadius.small,
    marginTop: Spacing.s,
    marginBottom: Spacing.m,
  },
  strengthBar: {
    height: '100%',
    borderRadius: BorderRadius.small,
    backgroundColor: '#4CAF50',
  },
});