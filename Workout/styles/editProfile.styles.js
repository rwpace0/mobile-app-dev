import { StyleSheet } from "react-native";
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
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    loadingText: {
      color: colors.textPrimary,
      fontSize: FontSize.medium,
    },
    
    scrollView: {
      flex: 1,
    },
    
    avatarSection: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.m,
    },
    
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.m,
      ...Shadow.medium,
    },
    
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    changePictureText: {
      color: colors.primaryBlue,
      fontSize: FontSize.medium,
      fontWeight: FontWeight.medium,
    },
    
    section: {
      marginTop: Spacing.l,
    },
    
    sectionHeader: {
      fontSize: FontSize.base,
      color: colors.textFaded,
      paddingHorizontal: Spacing.m,
      paddingBottom: Spacing.s,
      fontWeight: FontWeight.medium,
      textTransform: 'uppercase',
    },
    
    privateSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.m,
      paddingBottom: Spacing.s,
    },
    
    formField: {
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.xs,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderColor,
    },
    
    formFieldLabel: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      marginBottom: Spacing.xs,
    },
    
    formFieldInput: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      paddingVertical: Spacing.xs,
      minHeight: 24,
    },
    
    formFieldInputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    
    selectField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.m,
      paddingVertical: Spacing.m,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderColor,
    },
    
    selectFieldLabel: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
      flex: 1,
    },
    
    selectFieldRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    selectFieldValue: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      marginRight: Spacing.m,
    },
    
    selectFieldPlaceholder: {
      color: colors.textFaded,
    },
    
    selectButton: {
      fontSize: FontSize.medium,
      color: colors.primaryBlue,
      fontWeight: FontWeight.medium,
    },
    
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    
    modalContent: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      padding: Spacing.l,
      minWidth: 300,
      maxWidth: '80%',
    },
    
    modalTitle: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.l,
      textAlign: 'center',
    },
    
    modalOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.s,
      borderRadius: BorderRadius.md,
    },
    
    modalOptionSelected: {
      backgroundColor: colors.borderColor,
    },
    
    modalOptionText: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
    },
    
    modalOptionTextSelected: {
      color: colors.primaryBlue,
      fontWeight: FontWeight.medium,
    },
    
    modalCloseButton: {
      marginTop: Spacing.l,
      paddingVertical: Spacing.m,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.borderColor,
    },
    
    modalCloseText: {
      fontSize: FontSize.medium,
      color: colors.textPrimary,
      textAlign: 'center',
      fontWeight: FontWeight.medium,
    },
  });
};

export default createStyles(true); 