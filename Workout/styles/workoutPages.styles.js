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
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
  },
  
  headerTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    flex: 1,
  },

  headerButton: {
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    minWidth: 60,
  },

  cancelButton: {
    color: colors.primaryBlue,
  },

  saveButton: {
    color: colors.textPrimary,
    backgroundColor: colors.primaryBlue,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  routineNameInput: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.regular,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    marginBottom: Spacing.m,
  },

  nameInputContainer: {
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
  },

  nameInputLabel: {
    color: colors.textSecondary,
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  nameInput: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderColor,
    ...Shadow.small,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: FontSize.medium,
  },
  
  emptyWorkoutContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xl,
  },
  
  iconContainer: {
    marginBottom: Spacing.m,
  },
  
  getStartedText: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  
  instructionText: {
    color: colors.textSecondary,
    fontSize: FontSize.medium,
    textAlign: "center",
    marginBottom: Spacing.l,
  },

  exercisesContainer: {
    padding: Spacing.m,
  },
  
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBlue,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.m,
    alignSelf: 'center',
    ...Shadow.medium,
    width: '100%',
  },
  
  addExerciseText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.s,
    textAlign: 'center',
  },
  
  buttonContainer: {
    flexDirection: "row",
    marginTop: Spacing.l,
    gap: Spacing.s,
  },
  
  settingsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderColor,
    ...Shadow.small,
  },
  
  settingsText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
  
  discardButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.s,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.accentRed,
    ...Shadow.small,
  },
  
  discardText: {
    color: colors.accentRed,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundCard,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.lg,
    ...Shadow.medium,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.s,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statValue: {
    color: colors.textPrimary,
    fontSize: FontSize.xlarge,
    fontWeight: FontWeight.bold,
  },

  statDivider: {
    width: 1,
    backgroundColor: colors.borderColor,
    marginHorizontal: Spacing.s,
  },
});
};

// Default export for backward compatibility
export default createStyles(true);