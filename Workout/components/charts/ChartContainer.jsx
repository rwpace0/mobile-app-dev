import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "../../constants/theme";

const ChartContainer = ({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  emptyMessage = "No data available",
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundCard,
      borderRadius: BorderRadius.lg,
      marginHorizontal: Spacing.m,
      marginBottom: Spacing.l,
      paddingTop: Spacing.m,
      paddingBottom: Spacing.s,
    },
    header: {
      paddingHorizontal: Spacing.m,
      marginBottom: Spacing.m,
    },
    title: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: Spacing.xxs,
    },
    subtitle: {
      fontSize: FontSize.small,
      color: colors.textSecondary,
      fontWeight: FontWeight.regular,
    },
    content: {
      minHeight: 180,
    },
    loadingContainer: {
      height: 180,
      justifyContent: "center",
      alignItems: "center",
    },
    errorContainer: {
      height: 180,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.m,
    },
    errorText: {
      fontSize: FontSize.base,
      color: colors.accentRed,
      textAlign: "center",
    },
  });

export default React.memo(ChartContainer);
