import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, ActivityIndicator } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { StyleSheet } from "react-native";
import colors from "../constants/colors";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "../constants/theme";
import { WorkoutAPI } from "../API/workoutAPI";

const CHART_HEIGHT = 180;
const CHART_MARGIN = Spacing.m;
const SCREEN_WIDTH = Dimensions.get("window").width;

const WorkoutCountGraph = ({ timeRange = 8 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    weeks: [],
    counts: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await WorkoutAPI.getWorkoutCountsByWeek();
        setData(response);
      } catch (err) {
        setError(err.message || "Failed to fetch workout data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const formatDateLabel = (date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const chartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: "transparent",
    backgroundGradientTo: "transparent",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
    barPercentage: 0.4,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: "rgba(255, 255, 255, 0.08)",
    },
    propsForLabels: {
      fontSize: 11,
      fontFamily: "System",
      fill: "rgba(170, 170, 170, 1)",
    },
    propsForVerticalLabels: {
      fontSize: 11,
      fontFamily: "System",
      fill: "rgba(170, 170, 170, 1)",
    },
    formatYLabel: (value) => Math.round(value).toString(),
  };

  const chartData = {
    labels: data.weeks.map(formatDateLabel),
    datasets: [
      {
        data: data.counts,
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Workouts Per Week</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Workouts Per Week</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workouts Per Week</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={SCREEN_WIDTH - CHART_MARGIN * 4}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars={false}
          fromZero={true}
          withInnerLines={true}
          segments={4}
          yAxisInterval={1}
          flatColor={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          withCustomBarColorFromData={true}
          yAxisSuffix=""
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: CHART_MARGIN,
    margin: CHART_MARGIN,
    overflow: "hidden",
  },
  title: {
    fontSize: FontSize.large,
    fontWeight: FontWeight.semiBold,
    color: colors.textWhite,
    marginBottom: Spacing.s,
    paddingHorizontal: Spacing.xs,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: -Spacing.s,
  },
  chart: {
    borderRadius: BorderRadius.lg,
    paddingRight: -Spacing.m,
  },
  loadingContainer: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.m,
  },
  errorText: {
    color: colors.accentRed,
    fontSize: FontSize.medium,
    textAlign: "center",
  },
});

export default WorkoutCountGraph;
