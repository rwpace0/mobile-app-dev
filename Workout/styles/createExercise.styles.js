import { StyleSheet } from 'react-native';
import { getColors } from '../constants/colors';
import { Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.s,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    backgroundColor: colors.backgroundPrimary,
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
  imagetextPlaceholder: {
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
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.xxs,
  },
  input: {
    backgroundColor: colors.backgroundInput,
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dropdownMenu: {
    backgroundColor: colors.backgroundCard,
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
    color: colors.textPrimary,
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
};

// Default export for backward compatibility
export default createStyles(true); 