import { StyleSheet } from "react-native";
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
  },
  
  addExerciseText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
  
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  
  settingsButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  
  settingsText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
  },
  
  discardButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  
  discardText: {
    color: colors.accentRed,
    fontSize: FontSize.medium,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundCard,
    marginHorizontal: Spacing.m,
    marginVertical: Spacing.m,
    padding: Spacing.m,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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