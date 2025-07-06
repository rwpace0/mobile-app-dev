import { StyleSheet } from "react-native";
import { Spacing, FontSize, FontWeight, Shadow } from "../constants/theme";
import { getColors } from "../constants/colors";

export const createStyles = (isDark = true) => {
  const colors = getColors(isDark);
  
  return StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: colors.backgroundPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },

  leftContainer: {
    width: 80,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  rightContainer: {
    width: 80,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  titleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },

  title: {
    color: colors.textPrimary,
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
  },

  buttonText: {
    color: colors.primaryBlue,
    fontSize: FontSize.medium,
    fontWeight: FontWeight.medium,
  },

  buttonTextDisabled: {
    color: colors.textFaded,
  },

  iconButton: {
    padding: Spacing.xs,
    borderRadius: 8,
  },

  textButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.s,
    borderRadius: 8,
  },
});
};

// Default export for backward compatibility
export default createStyles(true);
