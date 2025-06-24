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
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: Spacing.s,
    
    backgroundColor: colors.backgroundDark,
  },

  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
    flex: 1,
  },

  tabItemActive: {
    alignItems: "center",
    justifyContent: "center",
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
