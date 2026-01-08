import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles as createHistoryStyles } from "../../styles/workoutHistory.styles";
import { createStyles as createStatisticsStyles } from "../../styles/statistics.styles";
import Header from "../../components/static/header";
import ViewModeToggle from "../../components/charts/ViewModeToggle";
import BarChart from "../../components/charts/BarChart";
import statisticsAPI from "../../API/statisticsAPI";

const WeeklySetsStatistics = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const historyStyles = createHistoryStyles(isDark);
  const statisticsStyles = createStatisticsStyles(isDark);

  const [viewMode, setViewMode] = useState("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);

  const fetchData = useCallback(
    async (mode, showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const data =
          mode === "week"
            ? await statisticsAPI.getSetsWeekly()
            : await statisticsAPI.getSetsMonthly();

        setChartData(data || []);
      } catch (error) {
        console.error("[Statistics] Error fetching weekly sets:", error);
        setChartData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(viewMode);
  }, [viewMode, fetchData]);

  const handleViewModeChange = useCallback(
    (mode) => {
      setViewMode(mode);
      fetchData(mode, false);
    },
    [fetchData]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(viewMode, false);
  }, [viewMode, fetchData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={historyStyles.container}>
        <Header title="Weekly Sets" leftComponent={{ type: "back" }} />
        <View style={historyStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={historyStyles.container}>
      <Header title="Weekly Sets" leftComponent={{ type: "back" }} />

      <ScrollView
        contentContainerStyle={statisticsStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryBlue}
          />
        }
      >
        <View style={statisticsStyles.chartSection}>
          <View style={statisticsStyles.chartHeader}>
            <Text style={statisticsStyles.chartTitle}>Sets Over Time</Text>
            <ViewModeToggle
              selectedMode={viewMode}
              onModeChange={handleViewModeChange}
            />
          </View>

          <View style={statisticsStyles.chartWrapper}>
            <BarChart
              data={chartData}
              yAccessor="sets"
              xAccessor="date"
              color={colors.primaryBlue}
              period={viewMode}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WeeklySetsStatistics;

