import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle, Line as SkiaLine } from "@shopify/react-native-skia";
import { matchFont } from "@shopify/react-native-skia";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { FontSize } from "../../constants/theme";
import { format, parseISO } from "date-fns";

/**
 * MultiLineChart - Displays multiple line series on a single chart
 * @param {Array} data - Array of data points with date and multiple series values
 * @param {Array} lines - Array of line configs: [{ key: string, color: string, enabled: boolean }]
 * @param {string} xAccessor - Key for x-axis data (default: "date")
 * @param {number} height - Chart height
 * @param {string} period - Time period for label formatting
 */
const MultiLineChart = ({
  data = [],
  lines = [],
  xAccessor = "date",
  height = 180,
  period = "1m",
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors, height);

  // Grid line color based on theme
  const gridLineColor = isDark ? "#2A2A2A" : "#E5E5EA";

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

  // Filter to only enabled lines
  const enabledLines = useMemo(
    () => lines.filter((line) => line.enabled),
    [lines]
  );

  // Transform data for CartesianChart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => {
      const point = {
        x: index,
        label: item[xAccessor],
      };

      // Add y values for each enabled line
      enabledLines.forEach((line) => {
        point[line.key] = Number(item[line.key] || 0);
      });

      return point;
    });
  }, [data, xAccessor, enabledLines]);

  // Get all y keys for the chart
  const yKeys = useMemo(
    () => enabledLines.map((line) => line.key),
    [enabledLines]
  );

  // Check if we have any data and enabled lines
  const hasData = data && data.length > 0 && enabledLines.length > 0;

  // Calculate max value across all enabled lines to set domain
  const maxValue = useMemo(() => {
    if (!hasData || chartData.length === 0 || yKeys.length === 0) return 10;

    let max = 0;
    chartData.forEach((point) => {
      yKeys.forEach((key) => {
        const value = point[key] || 0;
        if (value > max) max = value;
      });
    });

    // Use the actual max value (no padding) so the top of y-axis is the max data value
    return Math.ceil(max) || 1;
  }, [hasData, chartData, yKeys]);

  // Always call useChartPressState hook to maintain hook order
  const chartPressState = useChartPressState({ x: 0, y: {} });

  if (!font) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Loading chart...</Text>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>
          {enabledLines.length === 0
            ? "Select muscle groups to display"
            : "No data to display"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={yKeys}
        padding={{ left: 8, right: 8, top: 8, bottom: 8 }}
        domainPadding={{ left: 0, right: 20, top: 0, bottom: 0 }}
        domain={{
          x: chartData.length > 0 ? [0, chartData.length - 1] : [0, 1],
          y: [0, maxValue],
        }}
        axisOptions={{
          font,
          tickCount: {
            x: Math.min(chartData.length, period === "1y" ? 12 : 5),
            y: 6,
          },
          formatXLabel: (value) => {
            const index = Math.round(value);
            if (index < 0 || index >= chartData.length) return "";
            const item = chartData[index];
            if (!item) return "";

            // Always show the last label
            const isLastLabel = index === chartData.length - 1;

            // Format based on period
            try {
              const dateStr = item.label;
              const date = parseISO(dateStr);

              // For yearly view, show month initials
              if (period === "1y" || period === "all") {
                const formatted = format(date, "MMM");
                return isLastLabel ? formatted : formatted;
              }

              // For all other periods, show abbreviated month + day (Dec 21)
              return format(date, "MMM d");
            } catch {
              return "";
            }
          },
          formatYLabel: (value) => {
            // Only show integer values
            const rounded = Math.round(value);
            return rounded === value ? rounded.toString() : "";
          },
          labelColor: colors.textSecondary,
          lineColor: colors.borderColor,
          axisSide: {
            y: "left",
            x: "bottom",
          },
        }}
        chartPressState={chartPressState}
      >
        {({ points, chartBounds }) => {
          // Calculate Y tick positions based on the domain
          const yTickCount = 6;
          const yStep = maxValue / yTickCount;
          const yTicks = Array.from(
            { length: yTickCount + 1 },
            (_, i) => i * yStep
          );

          // Determine if we should render circles based on data size
          const shouldRenderCircles = chartData.length <= 20;
          // For larger datasets, only show every Nth circle
          const circleInterval =
            chartData.length > 30 ? 3 : chartData.length > 20 ? 2 : 1;

          return (
            <>
              {/* Render simplified horizontal grid lines - solid instead of dashed */}
              {yTicks.map((tickValue, i) => {
                const yRange = chartBounds.bottom - chartBounds.top;
                const yPosition =
                  chartBounds.bottom - (tickValue / maxValue) * yRange;

                return (
                  <SkiaLine
                    key={`grid-${i}`}
                    p1={{ x: chartBounds.left, y: yPosition }}
                    p2={{ x: chartBounds.right, y: yPosition }}
                    color={gridLineColor}
                    style="stroke"
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                );
              })}

              {/* Render lines */}
              {enabledLines.map((line) => (
                <React.Fragment key={line.key}>
                  <Line
                    points={points[line.key]}
                    color={line.color}
                    strokeWidth={2}
                    curveType="linear"
                    animate={{ type: "timing", duration: 300 }}
                  />
                  {/* Render data point dots - conditionally and with interval */}
                  {shouldRenderCircles &&
                    points[line.key]?.map((point, index) => {
                      // Only render every Nth circle for performance
                      if (
                        index % circleInterval !== 0 &&
                        index !== points[line.key].length - 1
                      ) {
                        return null;
                      }
                      return (
                        <Circle
                          key={`${line.key}-dot-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={2.5}
                          color={line.color}
                        />
                      );
                    })}
                </React.Fragment>
              ))}
            </>
          );
        }}
      </CartesianChart>
    </View>
  );
};

const createStyles = (colors, height) =>
  StyleSheet.create({
    container: {
      height: height,
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

export default React.memo(MultiLineChart);
