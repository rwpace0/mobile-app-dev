import React from "react";
import {
  SafeAreaView,
  View,
} from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles as createHistoryStyles } from "../../styles/workoutHistory.styles";
import Header from "../../components/static/header";

const RecentBestsStatistics = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const historyStyles = createHistoryStyles(isDark);

  return (
    <SafeAreaView style={historyStyles.container}>
      <Header title="Progression" leftComponent={{ type: "back" }} />
      <View />
    </SafeAreaView>
  );
};

export default RecentBestsStatistics;
