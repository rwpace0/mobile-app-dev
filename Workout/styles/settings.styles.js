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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.l,
    paddingHorizontal: Spacing.m,
  },
  backButton: {
    marginRight: Spacing.m,
  },
  headerTitle: {
    fontSize: FontSize.xxlarge,
    fontWeight: FontWeight.semiBold,
    color: colors.textWhite,
  },
  sectionHeader: {
    fontSize: FontSize.base,
    color: colors.textFaded,
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.l,
    paddingBottom: Spacing.xs,
    fontWeight: FontWeight.semiBold,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.m,
    width: Spacing.l,
    height: Spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: FontSize.medium,
    color: colors.textWhite,
    fontWeight: FontWeight.regular,
  },
});
