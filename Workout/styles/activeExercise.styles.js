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
    backgroundColor: colors.backgroundDark,
    marginBottom: Spacing.s,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.s,
    backgroundColor: colors.backgroundLight,
  },
  exerciseName: {
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
    color: colors.primaryLight,
  },
  notesInput: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    color: colors.textLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  restTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  restTimerText: {
    color: colors.primaryLight,
    marginLeft: Spacing.xs,
    fontSize: FontSize.small,
  },
  timerOffText: {
    color: colors.textFaded,
  },
  activeTimerText: {
    color: colors.accentGreen,
  },
  setsContainer: {
    marginTop: Spacing.xs,
  },
  setHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  setHeaderCell: {
    fontSize: FontSize.tiny,
    color: colors.textLight,
    fontWeight: FontWeight.medium,
  },
  setRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  completedSetRow: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  warmupSetRow: {
    backgroundColor: 'rgba(255, 235, 59, 0.2)',
  },
  setCell: {
    fontSize: FontSize.small,
    color: colors.textWhite,
  },
  setNumberCell: {
    width: '10%',
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
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.m,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  addSetText: {
    color: colors.textWhite,
    marginLeft: Spacing.xs,
    fontSize: FontSize.medium,
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