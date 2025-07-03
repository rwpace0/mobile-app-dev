import { StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    flex: 1,
  },

  headerButton: {
    padding: Spacing.xs,
  },

  profileSection: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.round,
    backgroundColor: colors.backgroundCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.m,
    ...Shadow.medium,
  },

  username: {
    color: colors.textPrimary,
    fontSize: FontSize.xlarge,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.s,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
  },

  statItem: {
    alignItems: "center",
  },

  statValue: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xxs,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: FontSize.base,
  },

  graphSection: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },

  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },

  timeText: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },

  periodText: {
    color: colors.textSecondary,
    fontSize: FontSize.base,
  },

  graphplaceholder: {
    height: 150,
    backgroundColor: colors.backgroundCard,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.medium,
  },

  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.s,
    marginTop: Spacing.m,
  },

  toggleButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.m,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.backgroundCard,
  },

  toggleButtonActive: {
    backgroundColor: colors.primaryBlue,
  },

  toggleText: {
    color: colors.textSecondary,
    fontSize: FontSize.base,
  },

  toggleTextActive: {
    color: colors.textPrimary,
  },

  dashboardSection: {
    padding: Spacing.m,
  },

  dashboardTitle: {
    color: colors.textSecondary,
    fontSize: FontSize.large,
    marginBottom: Spacing.m,
  },

  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.m,
  },

  dashboardItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    ...Shadow.medium,
  },

  dashboardItemText: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
  },
});
};

// Default export for backward compatibility
export default createStyles(true); 