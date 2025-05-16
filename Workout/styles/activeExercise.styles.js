import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";

export default StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  setHeaderCell: {
    color: colors.textFaded,
    fontSize: 12,
    fontWeight: "bold",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
    width: 50,
  },
  weightCell: {
    width: '60%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    width: '30%',
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  repsInput: {
    width: '20%',
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    textAlign: 'center',
  },
  totalCell: {
    width: '15%',
    textAlign: 'center',
  },
  completedCell: {
    width: '15%',
    alignItems: 'flex-end',
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
    color: colors.textWhite,
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
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingVertical: Spacing.l,
  },
  modalTitle: {
    color: colors.textWhite,
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
    backgroundColor: colors.cardBackground,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    margin: Spacing.xs,
  },
  presetTimeText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
  },
  modalCloseButton: {
    marginTop: Spacing.l,
    paddingVertical: Spacing.s,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.textLight,
    fontSize: FontSize.medium,
  },
});