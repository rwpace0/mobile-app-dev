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
    marginVertical: 20,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addImageText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 16,
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
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
}); 