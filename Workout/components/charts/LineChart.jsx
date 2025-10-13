import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { CartesianChart, Line } from "victory-native";
import { matchFont } from "@shopify/react-native-skia";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { FontSize } from "../../constants/theme";
import { format, parseISO } from "date-fns";

const LineChart = ({
  data = [],
  yAccessor = "value",
  xAccessor = "date",
  formatYValue = (value) => value.toString(),
  formatXLabel = (date) => {
    try {
      return format(parseISO(date), "MMM d");
    } catch {
      return date;
    }
  },
  color,
  height = 180,
  period = "1m", // Add period prop for label formatting
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const chartColor = color || colors.primaryBlue;

  // Use system font
  const font = useMemo(() => {
    try {
      return matchFont({
        fontFamily: Platform.select({
          ios: "Helvetica",
          android: "Roboto",
          default: "sans-serif",
        }),
        fontSize: 11,
        fontWeight: "400",
      });
    } catch (error) {
      console.error("Font loading error:", error);
      return null;
    }
  }, []);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  if (!font) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Loading chart...</Text>
      </View>
    );
  }

  // Transform data for CartesianChart
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      x: index,
      y: typeof item === "object" ? item[yAccessor] : item,
      label: typeof item === "object" ? item[xAccessor] : item,
    }));
  }, [data, yAccessor, xAccessor]);

  return (
    <View style={styles.container}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["y"]}
        padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
        domainPadding={{ left: 20, right: 20, top: 20, bottom: 0 }}
        domain={{ y: [0] }}
        axisOptions={{
          font,
          tickCount: {
            x: Math.min(chartData.length, period === "1y" ? 12 : 5),
            y: Math.max(
              3,
              Math.min(
                5,
                [...new Set(chartData.map((d) => Math.round(d.y)))].length
              )
            ),
          },
          formatXLabel: (value) => {
            const index = Math.round(value);
            if (index < 0 || index >= chartData.length) return "";
            const item = chartData[index];
            if (!item) return "";

            // Format based on period
            try {
              const dateStr = item.label;
              const date = parseISO(dateStr);

              // For yearly view, show month initials
              if (period === "1y") {
                return format(date, "MMMMM").charAt(0); // First letter of month
              }

              // For 7d view, show day abbreviation
              if (period === "7d") {
                return format(date, "EEE").charAt(0); // M, T, W, etc.
              }

              // For other periods, show M/d
              return format(date, "M/d");
            } catch {
              return "";
            }
          },
          formatYLabel: (value) => {
            // Only show integer values and avoid duplicates
            const rounded = Math.round(value);
            return rounded === value ? rounded.toString() : "";
          },
          labelColor: colors.textSecondary,
        }}
      >
        {({ points, chartBounds }) => (
          <Line
            points={points.y}
            color={chartColor}
            strokeWidth={2}
            curveType="catmullRom"
            animate={{ type: "timing", duration: 300 }}
          />
        )}
      </CartesianChart>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      height: 180,
      width: "100%",
      paddingHorizontal: 12,
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: FontSize.base,
      color: colors.textSecondary,
    },
  });

export default React.memo(LineChart);
