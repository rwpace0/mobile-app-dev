import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
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
    paddingVertical: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  headerTitle: {
    color: colors.textWhite,
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
    borderBottomColor: colors.divider,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: Spacing.l,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.m,
  },

  username: {
    color: colors.textWhite,
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
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xxs,
  },

  statLabel: {
    color: colors.textLight,
    fontSize: FontSize.base,
  },

  graphSection: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  graphHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.m,
  },

  timeText: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },

  periodText: {
    color: colors.textLight,
    fontSize: FontSize.base,
  },

  graphPlaceholder: {
    height: 150,
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: colors.cardBackground,
  },

  toggleButtonActive: {
    backgroundColor: colors.primaryBlue,
  },

  toggleText: {
    color: colors.textLight,
    fontSize: FontSize.base,
  },

  toggleTextActive: {
    color: colors.textWhite,
  },

  dashboardSection: {
    padding: Spacing.m,
  },

  dashboardTitle: {
    color: colors.textLight,
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
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.m,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
  },

  dashboardItemText: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.medium,
  },
}); 