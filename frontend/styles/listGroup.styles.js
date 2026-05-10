import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";

/**
 * Grouped nav lists (settings rows, profile dashboard, statistics sections).
 * Use: const lg = createListGroupStyleSheet(colors); StyleSheet.create({ ...lg aliases })
 */
export function createListGroupStyleSheet(colors) {
  return {
    listGroup: {
      backgroundColor: colors.backgroundSecondary,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.m,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: colors.borderColor,
      overflow: "hidden",
    },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: Spacing.m + 2,
      paddingHorizontal: Spacing.m,
      backgroundColor: colors.backgroundSecondary,
    },
    listRowBorder: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.borderColor,
    },
    listRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.m,
      flex: 1,
    },
    listIconWrap: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundCard,
      justifyContent: "center",
      alignItems: "center",
    },
    listRowTitle: {
      fontSize: FontSize.base,
      color: colors.textPrimary,
      fontWeight: FontWeight.medium,
    },
    listSectionTitle: {
      fontSize: FontSize.caption,
      color: colors.textFaded,
      paddingHorizontal: Spacing.m,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.s,
      fontWeight: FontWeight.semiBold,
      letterSpacing: 1,
    },
    listScrollContentPadding: {
      paddingBottom: Spacing.xxxl,
    },
  };
}
