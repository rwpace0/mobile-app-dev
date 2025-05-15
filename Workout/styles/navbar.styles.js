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
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: Spacing.s,
    paddingHorizontal: Spacing.l,
    backgroundColor: colors.backgroundDark,
  },
  
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  
  tabItemActive: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
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