import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { CartesianChart, Bar } from "victory-native";
import { matchFont } from "@shopify/react-native-skia";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { FontSize } from "../../constants/theme";
import { format, parseISO } from "date-fns";

const BarChart = ({
  data = [],
  yAccessor = "value",
  xAccessor = "label",
  formatYValue = (value) => value.toString(),
  formatXLabel = (label) => {
    try {
      if (typeof label === "string" && label.includes("-")) {
        return format(parseISO(label), "MMM d");
      }
      return label;
    } catch {
      return label;
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

  // Transform data for CartesianChart - ensure all values are valid numbers
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      const yValue = typeof item === "object" ? item[yAccessor] : item;
      // Ensure y is always a valid number
      const numericY =
        typeof yValue === "number" && !isNaN(yValue) ? yValue : 0;

      return {
        x: index,
        y: numericY,
        label: typeof item === "object" ? item[xAccessor] : item,
      };
    });
  }, [data, yAccessor, xAccessor]);

  // Calculate bar width - make bars very thick
  const barWidth = useMemo(() => {
    // Use absolute pixel width for thick bars
    return 12;
  }, [period]);

  return (
    <View style={styles.container}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["y"]}
        padding={{ left: 12, right: 12, top: 10, bottom: 10 }}
        domainPadding={{ left: 30, right: 30, top: 20, bottom: 0 }}
        domain={{ y: [0] }}
        axisOptions={{
          font,
          tickCount: {
            x: chartData.length, // Show all data points
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
              const labelStr = item.label;
              if (typeof labelStr === "string" && labelStr.includes("-")) {
                const date = parseISO(labelStr);

                // For month view, show first letter of month
                if (period === "month") {
                  return format(date, "MMMMM").charAt(0);
                }

                // For week view, show M/d format (week start date)
                if (period === "week") {
                  return format(date, "M/d");
                }

                // For other periods, show M/d
                return format(date, "M/d");
              }
              return labelStr.substring(0, 5);
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
          <Bar
            points={points.y}
            chartBounds={chartBounds}
            color={chartColor}
            barWidth={barWidth}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
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

export default React.memo(BarChart);
