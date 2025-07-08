import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from "../constants/theme";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },

  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: 'center',
    flex: 1,
  },
  headerAction: {
    color: colors.primaryLight,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  debugButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
    backgroundColor: colors.backgroundSecondary,
  },

  // Workout History Card styles
  workoutCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    padding: Spacing.m,
    ...Shadow.medium,
  },
  workoutTitle: {
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    color: colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  workoutDate: {
    fontSize: FontSize.small,
    color: colors.textSecondary,
    marginBottom: Spacing.m,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  statItemWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.xl,
  },
  statIcon: {
    marginRight: Spacing.xxs,
  },
  statText: {
    fontSize: FontSize.medium,
    color: colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  exerciseList: {
    marginTop: Spacing.m,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: FontSize.medium,
    color: colors.textSecondary,
  },
  bestSet: {
    fontSize: FontSize.medium,
    color: colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  recordBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xxs,
  },
  recordText: {
    fontSize: FontSize.caption,
    color: colors.primaryLight,
    marginLeft: Spacing.xxs,
  },

  // Exercise Preview styles
  exercisePreview: {
    marginTop: Spacing.xs,
  },
  exercisePreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xxs,
  },
  exerciseIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    backgroundColor: colors.backgroundSecondary,
  },
  exerciseName: {
    fontSize: FontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  exerciseStats: {
    fontSize: FontSize.caption,
    color: colors.textSecondary,
  },
  seeMoreText: {
    fontSize: FontSize.caption,
    color: colors.primaryLight,
    marginTop: Spacing.xs,
  },

  // Workout Detail styles
  detailContainer: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
    paddingTop: Spacing.m,
  },
  detailHeader: {
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.l,
  },
  detailTitle: {
    fontSize: FontSize.xlarge,
    fontWeight: FontWeight.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  detailDate: {
    fontSize: FontSize.medium,
    color: colors.textSecondary,
    marginBottom: Spacing.s,
  },

  // Exercise Card styles
  exerciseCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    padding: Spacing.m,
    ...Shadow.medium,
  },
  exerciseCardTitle: {
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    color: colors.primaryLight,
    marginBottom: Spacing.s,
  },
  exerciseNotes: {
    fontSize: FontSize.small,
    color: colors.textSecondary,
    marginBottom: Spacing.s,
    fontStyle: 'italic',
  },

  // Set styles
  setHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    marginBottom: Spacing.xs,
  },
  setHeaderText: {
    fontSize: FontSize.caption,
    color: colors.textSecondary,
    width: 80,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xxs,
  },
  setNumber: {
    width: 40,
    fontSize: FontSize.base,
    color: colors.textSecondary,
  },
  setValue: {
    fontSize: FontSize.base,
    color: colors.textPrimary,
    marginLeft: Spacing.s,
  },

  // Loading and Error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundPrimary,
  },
  errorText: {
    fontSize: FontSize.large,
    color: colors.accentRed,
    textAlign: "center",
  },

  loadingMore: {
    paddingVertical: Spacing.l,
    alignItems: 'center',
    justifyContent: 'center'
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.l,
  },

  retryButton: {
    marginTop: Spacing.m,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.l,
    backgroundColor: colors.primaryBlue,
    borderRadius: BorderRadius.md,
  },

  retryText: {
    color: colors.textWhite,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
  },

  footerRetry: {
    paddingVertical: Spacing.m,
    alignItems: 'center',
  },

  footerRetryText: {
    color: colors.primaryBlue,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  emptyText: {
    fontSize: FontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  retryingText: {
    marginTop: Spacing.xs,
    color: colors.textSecondary,
    fontSize: FontSize.caption,
  },

  // Start Routine Button
  startRoutineButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.l,
  },
  startRoutineText: {
    color: colors.textWhite,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },
  
});
};

// Default export for backward compatibility
export default createStyles(true);
