import { StyleSheet, Dimensions } from "react-native";
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

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundPrimary,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.s,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },

  closeButton: {
    padding: Spacing.xs,
  },

  headerActions: {
    flexDirection: "row",
  },

  headerActionText: {
    color: colors.primaryBlue,
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
    backgroundColor: colors.backgroundInput,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundCard,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.xs,
    flex: 1,
    
  },

  filterText: {
    color: colors.textPrimary,
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
    borderBottomColor: colors.borderColor,
  },

  selectedExerciseItem: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  exerciseIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
  },

  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  exerciseDetails: {
    flex: 1,
    marginLeft: Spacing.m,
  },

  exerciseName: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xxs,
  },

  exerciseMuscleGroup: {
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontSize: FontSize.large,
  },
});
};

// Default export for backward compatibility
export default createStyles(true);
