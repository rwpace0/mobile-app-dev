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
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  headerTitle: {
    color: colors.textWhite,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },
  
  section: {
    marginTop: Spacing.l,
  },
  
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.s,
  },
  
  sectionTitle: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.s,
  },
  
  startEmptyWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryBlue,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.s,
  },
  
  startEmptyWorkoutText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    marginLeft: Spacing.s,
  },
  
  routineActionButtons: {
    flexDirection: "row",
    marginBottom: Spacing.m,
  },
  
  routineActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.m,
  },
  
  routineActionText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    marginLeft: Spacing.xs,
  },
  
  emptyRoutinesContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.m,
    marginTop: Spacing.s,
  },
  
  emptyRoutinesText: {
    color: colors.textLight,
    fontSize: FontSize.medium,
    textAlign: "center",
  },

  // Template list styles
  templateContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },

  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },

  templateName: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },

  templateExercises: {
    color: colors.textLight,
    fontSize: FontSize.base,
    marginBottom: Spacing.m,
    lineHeight: 22,
  },

  startRoutineButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },

  startRoutineText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },
});