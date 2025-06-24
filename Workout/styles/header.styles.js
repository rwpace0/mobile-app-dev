import { StyleSheet } from "react-native";
import { Spacing, FontSize, FontWeight } from "../constants/theme";
import { getColors } from "../constants/colors";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: colors.backgroundDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
  },

  leftContainer: {
    minWidth: 40,
    alignItems: "flex-start",
  },

  rightContainer: {
    minWidth: 40,
    alignItems: "flex-end",
  },

  titleContainer: {
    flex: 1,
    alignItems: "center",
  },

  title: {
    color: colors.textWhite,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },

  buttonText: {
    color: colors.primaryBlue,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
  },

  iconButton: {
    padding: Spacing.xs,
  },
});
};

// Default export for backward compatibility
export default createStyles(true);
