import { StyleSheet } from 'react-native';
import colors from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.s,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.backgroundDark,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerActionText: {
    color: colors.textFaded,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
  },
  headerActionTextActive: {
    color: colors.primaryLight,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  addImageText: {
    color: colors.primaryLight,
    marginTop: Spacing.s,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
  },
  formContainer: {
    paddingHorizontal: Spacing.l,
  },
  label: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.xxs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    color: colors.textWhite,
    fontSize: FontSize.base,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: colors.accentRed,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownMenu: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: BorderRadius.sm,
  },
  dropdownItemText: {
    color: colors.textWhite,
    fontSize: FontSize.base,
  },
  errorText: {
    color: colors.accentRed,
    fontSize: FontSize.small,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
}); 