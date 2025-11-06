import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";

const WeeklyCalendar = ({ schedule, onDayPress }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors, isDark);

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
  const fullDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();

  // Create a map of day_of_week to template info for easy lookup
  const scheduleMap = {};
  if (schedule && Array.isArray(schedule)) {
    schedule.forEach((item) => {
      scheduleMap[item.day_of_week] = {
        template_id: item.template_id,
        template_name: item.template_name,
      };
    });
  }

  return (
    <View style={styles.container}>
      {daysOfWeek.map((day, index) => {
        // Adjust index for Monday start (0=Sun -> 1=Mon)
        const dayIndex = index === 6 ? 0 : index + 1;
        const isToday = dayIndex === today;
        const scheduleInfo = scheduleMap[dayIndex];
        const hasWorkout = scheduleInfo?.template_id;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayContainer,
              isToday && styles.todayContainer,
              hasWorkout && styles.workoutContainer,
            ]}
            onPress={() => onDayPress && onDayPress(dayIndex)}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
              {day}
            </Text>
            <View style={styles.dayContentContainer}>
              <View
                style={[
                  styles.dayIndicator,
                  hasWorkout ? styles.workoutIndicator : styles.restIndicator,
                  isToday && styles.todayIndicator,
                ]}
              />
              <Text
                style={[
                  styles.workoutText,
                  !hasWorkout && styles.restText,
                  isToday && styles.todayWorkoutText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {hasWorkout ? scheduleInfo.template_name : "Rest"}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 4,
      gap: 8,
    },
    dayContainer: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 6,
      borderRadius: 16,
      backgroundColor: colors.backgroundCard,
      minHeight: 100,
    },
    todayContainer: {
      backgroundColor: colors.primaryBlue + "15",
      borderWidth: 2,
      borderColor: colors.primaryBlue,
    },
    workoutContainer: {
      backgroundColor: colors.primaryBlue + "08",
    },
    dayLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    todayLabel: {
      color: colors.primaryBlue,
      fontWeight: "700",
    },
    dayContentContainer: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      width: "100%",
    },
    dayIndicator: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginBottom: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    workoutIndicator: {
      backgroundColor: colors.primaryBlue,
    },
    restIndicator: {
      backgroundColor: colors.border,
    },
    todayIndicator: {
      borderWidth: 2,
      borderColor: colors.primaryBlue + "50",
    },
    workoutText: {
      fontSize: 11,
      color: colors.textPrimary,
      textAlign: "center",
      fontWeight: "500",
      paddingHorizontal: 2,
    },
    todayWorkoutText: {
      fontWeight: "600",
      color: colors.textPrimary,
    },
    restText: {
      color: colors.textFaded,
      fontSize: 10,
    },
  });

export default WeeklyCalendar;
