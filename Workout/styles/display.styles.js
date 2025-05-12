import { StyleSheet, Dimensions } from "react-native";
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

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundDark,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  closeButton: {
    padding: Spacing.xs,
  },

  headerActions: {
    flexDirection: "row",
  },

  headerActionText: {
    color: colors.textFaded,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
  },

  headerActionTextActive: {
    color: colors.primaryLight,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.semiBold,
  },

  searchContainer: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.m,
  },

  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.m,
    height: 40,
  },

  searchIcon: {
    marginRight: Spacing.s,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: colors.textWhite,
    fontSize: FontSize.base,
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.m,
    paddingBottom: Spacing.m,
    width: "100%",
    justifyContent: "space-between",
  },

  filterButton: {
    backgroundColor: colors.cardBackground,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.xs,
    flex: 1,
  },

  filterText: {
    color: colors.textLight,
    fontSize: FontSize.caption,
    textAlign: "center",
  },

  exerciseListContainer: {
    flex: 1,
    paddingHorizontal: Spacing.m,
  },

  listContentContainer: {
    paddingBottom: Spacing.xl,
  },

  exerciseList: {
    flex: 1,
  },

  exerciseItem: {
    paddingVertical: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  exerciseIconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.md,
  },

  exerciseDetails: {
    flex: 1,
    marginLeft: Spacing.m,
  },

  exerciseName: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xxs,
  },

  exerciseMuscleGroup: {
    color: colors.textLight,
    fontSize: FontSize.medium,
  },

  errorText: {
    color: colors.accentRed,
    fontSize: FontSize.large,
  },

  // Style for highlighted search text
  highlightedText: {
    fontWeight: FontWeight.bold,
    color: colors.primaryLight,
  },

  // Empty list state
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.xxl,
  },

  emptyListText: {
    color: colors.textLight,
    fontSize: FontSize.large,
  },
});
