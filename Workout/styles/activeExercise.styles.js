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
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  notesInput: {
    color: "#FFFFFF",
    fontSize: 14,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    marginBottom: 12,
  },
  restTimerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  restTimerText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  timerOffText: {
    color: colors.textFaded,
  },
  activeTimerText: {
    color: colors.accentGreen,
  },
  setsContainer: {
    marginTop: 8,
  },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  setHeaderCell: {
    color: colors.textFaded,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  completedSetRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  warmupSetRow: {
    backgroundColor: 'rgba(255, 235, 59, 0.2)',
  },
  setCell: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  setNumberCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousCell: {
    flex: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  weightHeaderCell: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repsHeaderCell: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
  },
  repsInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
  },
  totalCell: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completedCheckmark: {
    backgroundColor: '#4CAF50',
  },
  deleteSetButton: {
    marginLeft: "auto",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  addSetText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 14,
  },
  addExerciseButton: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
  },
  addExerciseText: {
    color: colors.textPrimary,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.medium,
  },

  // Rest Timer Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.backgroundPrimary,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingVertical: Spacing.l,
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
    backgroundColor: colors.backgroundCard,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    margin: Spacing.xs,
  },
  presetTimeText: {
    color: colors.textPrimary,
    fontSize: FontSize.medium,
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