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

  headerLeft: {
    width: 40,
  },

  headerTitle: {
    flex: 1,
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    textAlign: "center",
  },

  headerRight: {
    width: 40,
  },

  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  tab: {
    flex: 1,
    paddingVertical: Spacing.m,
    alignItems: "center",
  },

  tabText: {
    fontSize: FontSize.medium,
    color: colors.textLight,
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryLight,
  },

  activeTabText: {
    color: colors.primaryLight,
    fontWeight: FontWeight.semiBold,
  },

  content: {
    flex: 1,
    padding: Spacing.m,
  },

  // Exercise image styles
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.m,
    overflow: 'hidden',
  },

  exerciseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Info cards styles
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    marginRight: Spacing.m,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: FontSize.small,
    color: colors.textLight,
    marginBottom: Spacing.xxs,
  },

  infoText: {
    fontSize: FontSize.medium,
    color: colors.textWhite,
    fontWeight: FontWeight.medium,
  },

  // Summary tab styles
  instructionContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.m,
    marginBottom: Spacing.m,
  },

  instructionLabel: {
    fontSize: FontSize.medium,
    color: colors.textLight,
    marginBottom: Spacing.s,
  },

  instructionText: {
    fontSize: FontSize.base,
    color: colors.textWhite,
    lineHeight: 24,
  },

  // History tab styles
  workoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.m,
    marginBottom: Spacing.m,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  workoutTitle: {
    fontSize: FontSize.large,
    color: colors.textWhite,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.xxs,
  },

  workoutDate: {
    fontSize: FontSize.small,
    color: colors.textLight,
    marginBottom: Spacing.m,
  },

  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    backgroundColor: colors.backgroundDark,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.s,
  },

  setNumber: {
    width: 50,
    fontSize: FontSize.base,
    color: colors.textLight,
    fontWeight: FontWeight.medium,
  },

  setInfo: {
    flex: 1,
    fontSize: FontSize.base,
    color: colors.textWhite,
    fontWeight: FontWeight.medium,
  },

  setsContainer: {
    marginTop: Spacing.s,
  },

  setsHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.s,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  setsHeaderText: {
    fontSize: FontSize.small,
    color: colors.textLight,
    fontWeight: FontWeight.medium,
  },

  notes: {
    fontSize: FontSize.base,
    color: colors.textLight,
    marginTop: Spacing.s,
    fontStyle: "italic",
  },

  emptyHistory: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },

  emptyHistoryText: {
    fontSize: FontSize.large,
    color: colors.textLight,
    textAlign: "center",
  },
}); 