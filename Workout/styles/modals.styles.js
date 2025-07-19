import { StyleSheet, Dimensions } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from "../constants/theme";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlayMedium,
  },
  centerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlayMedium,
    padding: Spacing.l,
  },
  modalContent: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingVertical: Spacing.l,
    ...Shadow.large,
  },
  deleteModalContent: {
    backgroundColor: colors.backgroundPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.l,
    width: '100%',
    maxWidth: 320,
    ...Shadow.large,
  },
  deleteModalText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    textAlign: 'center',
    marginBottom: Spacing.l,
  },
  deleteModalButtons: {
    width: '100%',
  },
  deleteModalCancelButton: {
    width: '100%',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.backgroundCard,
    marginTop: Spacing.xs,
    
  },
  deleteModalConfirmButton: {
    width: '100%',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.accentRed,
    marginBottom: Spacing.xs,
  },
  deleteModalCancelText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
  },  
  deleteModalConfirmText: {
    color: colors.accentRed,
    fontSize: FontSize.medium,
    textAlign: 'center',
    paddingVertical: Spacing.xs,
  },
  
  // Alert Modal Styles
  alertModalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.l,
    width: '100%',
    maxWidth: 320,
    ...Shadow.large,
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.m,
  },
  alertModalTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  alertModalText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    textAlign: 'center',
    marginBottom: Spacing.l,
    lineHeight: 20,
  },
  alertModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.m,
  },
  alertModalButton: {
    backgroundColor: colors.primaryBlue,
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  alertModalButtonText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    width: '100%',
  },
  
  // Alert Modal Icon Container Variants
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.m,
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

// Bottom Sheet Modal Styles
export const createBottomSheetStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlayMedium,
      justifyContent: 'flex-end',
    },
    backdropTouchable: {
      flex: 1,
    },
    bottomSheet: {
      backgroundColor: colors.backgroundPrimary,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.s,
      maxHeight: '80%',
      ...Shadow.large,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.s,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: colors.borderColor,
      borderRadius: BorderRadius.xs,
    },
    titleContainer: {
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    title: {
      color: colors.textPrimary,
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      textAlign: 'center',
    },
    actionsContainer: {
      paddingHorizontal: Spacing.l,
      paddingTop: Spacing.m,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundCard,
      marginBottom: Spacing.xs,
      borderRadius: BorderRadius.md,
    },
    firstAction: {
      borderTopLeftRadius: BorderRadius.md,
      borderTopRightRadius: BorderRadius.md,
    },
    lastAction: {
      borderBottomLeftRadius: BorderRadius.md,
      borderBottomRightRadius: BorderRadius.md,
      marginBottom: Spacing.none,
    },
    actionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    actionText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
      marginLeft: Spacing.m,
    },
    destructiveAction: {
      backgroundColor: colors.errorOverlay,
    },
    destructiveText: {
      color: colors.accentRed,
    },
    disabledAction: {
      backgroundColor: colors.backgroundSecondary,
    },
    disabledText: {
      color: colors.textDisabled,
    },
    safeAreaBottom: {
      height: Spacing.l, // Safe area bottom padding
    },
  });
};

// Default export for backward compatibility
export default createStyles(true); 