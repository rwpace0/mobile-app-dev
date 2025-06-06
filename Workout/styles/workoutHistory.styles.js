import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from "../constants/theme";

export default StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },

  // Header styles
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

  // Workout History Card styles
  workoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.m,
    marginBottom: Spacing.m,
    padding: Spacing.m,
    ...Shadow.medium,
  },
  workoutTitle: {
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    color: colors.textWhite,
    marginBottom: Spacing.xxs,
  },
  workoutDate: {
    fontSize: FontSize.small,
    color: colors.textLight,
    marginBottom: Spacing.m,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
    color: colors.textLight,
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
    color: colors.textLight,
  },
  bestSet: {
    fontSize: FontSize.medium,
    color: colors.textLight,
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
    backgroundColor: colors.backgroundMedium,
  },
  exerciseName: {
    fontSize: FontSize.base,
    color: colors.textWhite,
    flex: 1,
  },
  exerciseStats: {
    fontSize: FontSize.caption,
    color: colors.textLight,
  },
  seeMoreText: {
    fontSize: FontSize.caption,
    color: colors.primaryLight,
    marginTop: Spacing.xs,
  },

  // Workout Detail styles
  detailContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    paddingTop: Spacing.m,
  },
  detailHeader: {
    paddingHorizontal: Spacing.m,
    marginBottom: Spacing.l,
  },
  detailTitle: {
    fontSize: FontSize.xlarge,
    fontWeight: FontWeight.bold,
    color: colors.textWhite,
    marginBottom: Spacing.xs,
  },
  detailDate: {
    fontSize: FontSize.medium,
    color: colors.textLight,
    marginBottom: Spacing.s,
  },

  // Exercise Card styles
  exerciseCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textLight,
    marginBottom: Spacing.s,
    fontStyle: 'italic',
  },

  // Set styles
  setHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: Spacing.xs,
  },
  setHeaderText: {
    fontSize: FontSize.caption,
    color: colors.textLight,
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
    color: colors.textLight,
  },
  setValue: {
    fontSize: FontSize.base,
    color: colors.textWhite,
    marginLeft: Spacing.s,
  },

  // Loading and Error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundDark,
  },
  errorText: {
    fontSize: FontSize.large,
    color: colors.accentRed,
    textAlign: "center",
  },
});
