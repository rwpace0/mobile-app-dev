import { StyleSheet, Dimensions } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Spacing.l,
  },
  modalContent: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingVertical: Spacing.l,
  },
  deleteModalContent: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.l,
    width: '100%',
    maxWidth: 320,
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.m,
  },
  deleteModalTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  deleteModalText: {
    color: colors.textSecondary,
    fontSize: FontSize.medium,
    textAlign: 'center',
    marginBottom: Spacing.l,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.m,
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.backgroundCard,
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FF4444',
  },
  deleteModalCancelText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  deleteModalConfirmText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  presetTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.m,
  },
  presetTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    margin: Spacing.xs,
    minWidth: 80,
    justifyContent: 'center',
  },
  selectedPresetButton: {
    backgroundColor: colors.primaryLight,
  },
  offButton: {
    backgroundColor: colors.textFaded,
  },
  presetTimeText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    textAlign: 'center',
  },
  selectedPresetText: {
    fontWeight: FontWeight.bold,
  },
  offIcon: {
    marginRight: Spacing.xs,
  },
  modalCloseButton: {
    marginTop: Spacing.l,
    paddingVertical: Spacing.s,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontSize: FontSize.medium,
  },
});
};

// Default export for backward compatibility
export default createStyles(true); 