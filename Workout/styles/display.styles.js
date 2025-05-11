import { StyleSheet, Dimensions } from 'react-native';
import colors from '../constants/colors';
import { Spacing, BorderRadius, FontSize } from '../constants/theme';
import components from '../constants/components';
import layout from '../constants/layout';

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

  exerciseItem: {
    padding: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#333',
    marginBottom: Spacing.s,
    width: '100%',
  },

  exerciseName: {
    fontSize: FontSize.medium,
    fontWeight: '600',
    color: colors.textWhite,
    marginBottom: Spacing.xs,
  },

  displayText: {
    fontSize: FontSize.base,
    color: colors.textWhite,
    marginBottom: Spacing.s,
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

  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
  },
  desc: {
    marginTop: 4,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});