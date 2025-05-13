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
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  headerTitle: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },
  
  finishButton: {
    color: colors.primaryLight,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },
  
  content: {
    flex: 1,
  },
  
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  statItem: {
    alignItems: "center",
  },
  
  statLabel: {
    color: colors.textLight,
    fontSize: FontSize.small,
    marginBottom: Spacing.xxs,
  },
  
  statValue: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
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
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  
  instructionText: {
    color: colors.textLight,
    fontSize: FontSize.medium,
    textAlign: "center",
    marginBottom: Spacing.l,
  },
  
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.m,
  },
  
  addExerciseText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
  
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  
  settingsButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
  },
  
  settingsText: {
    color: colors.textWhite,
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
});