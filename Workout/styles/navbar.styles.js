import { StyleSheet } from "react-native";
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
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
    paddingTop: Spacing.none,
    paddingBottom: Spacing.l,
    backgroundColor: colors.backgroundPrimary,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    padding: Spacing.xs,
    flex: 1,
  },

  tabItemActive: {
    alignItems: "center",
    justifyContent: "flex-start",
    padding: Spacing.xs,
    flex: 1,
  },

  tabText: {
    color: colors.textFaded,
    fontSize: FontSize.small,
    marginTop: Spacing.xxs,
  },

  tabTextActive: {
    color: colors.primaryLight,
    fontSize: FontSize.small,
    marginTop: Spacing.xxs,
  },
});
};

// Default export for backward compatibility
export default createStyles(true);