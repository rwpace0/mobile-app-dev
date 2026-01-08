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
import BarChart from "../../components/charts/BarChart";
import statisticsAPI from "../../API/statisticsAPI";

const MuscleGroupsStatistics = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const historyStyles = createHistoryStyles(isDark);
  const statisticsStyles = createStatisticsStyles(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const result = await statisticsAPI.getMuscleGroupDistribution("3m");
      setData(result || []);
    } catch (error) {
      console.error(
        "[Statistics] Error fetching muscle group distribution:",
        error
      );
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={historyStyles.container}>
        <Header
          title="Muscle Groups"
          leftComponent={{ type: "back" }}
        />
        <View style={historyStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={historyStyles.container}>
      <Header
        title="Muscle Groups"
        leftComponent={{ type: "back" }}
      />

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
            <Text style={statisticsStyles.chartTitle}>
              Sets per Muscle Group
            </Text>
          </View>

          <View style={statisticsStyles.chartWrapper}>
            <BarChart
              data={data.map((item) => ({
                muscleGroup: item.muscleGroup,
                sets: item.count,
              }))}
              yAccessor="sets"
              xAccessor="muscleGroup"
              color={colors.primaryBlue}
              period="week"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MuscleGroupsStatistics;

