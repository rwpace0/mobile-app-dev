import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";

export default StyleSheet.create({
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
