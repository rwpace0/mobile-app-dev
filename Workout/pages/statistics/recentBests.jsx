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
import statisticsAPI from "../../API/statisticsAPI";
import { useWeight } from "../../utils/useWeight";
import { format, parseISO } from "date-fns";

const formatDate = (isoString) => {
  try {
    const date = parseISO(isoString);
    return format(date, "MMM d, yyyy");
  } catch (err) {
    console.error("Date formatting error:", err);
    return "Invalid Date";
  }
};

const RecentBestsStatistics = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const historyStyles = createHistoryStyles(isDark);
  const statisticsStyles = createStatisticsStyles(isDark);
  const weight = useWeight();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prs, setPrs] = useState([]);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const result = await statisticsAPI.getRecentBests("6m", 15);
      setPrs(result || []);
    } catch (error) {
      console.error("[Statistics] Error fetching recent bests:", error);
      setPrs([]);
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
        <Header title="Recent Bests" leftComponent={{ type: "back" }} />
        <View style={historyStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={historyStyles.container}>
      <Header title="Recent Bests" leftComponent={{ type: "back" }} />

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
        <View style={statisticsStyles.sectionsGroup}>
          {prs.length === 0 ? (
            <View style={statisticsStyles.emptyContainer}>
              <Text style={statisticsStyles.emptyTitle}>
                No personal records yet
              </Text>
              <Text style={statisticsStyles.emptyMessage}>
                Push your sets to new weights and reps to see recent bests
                here.
              </Text>
            </View>
          ) : (
            prs.map((pr, index) => (
              <View
                key={`${pr.exerciseId}-${index}`}
                style={[
                  statisticsStyles.sectionItem,
                  index !== prs.length - 1 &&
                    statisticsStyles.sectionItemBorder,
                ]}
              >
                <View style={statisticsStyles.sectionLeft}>
                  <View>
                    <Text style={statisticsStyles.sectionTitle}>{pr.name}</Text>
                    {pr.muscleGroup ? (
                      <Text style={statisticsStyles.exerciseMuscle}>
                        {pr.muscleGroup}
                      </Text>
                    ) : null}
                    <Text style={statisticsStyles.exerciseCount}>
                      {formatDate(pr.date)}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={statisticsStyles.exerciseVolume}>
                    {weight.formatSet(pr.weight, pr.reps)}
                  </Text>
                  <Text style={statisticsStyles.exerciseCount}>Best set</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecentBestsStatistics;

