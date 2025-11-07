import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from "../constants/theme";
import planAPI from "../API/planAPI";

const ScrollableCalendar = ({
  plan,
  onDayPress,
  startDate,
  patternLength,
  schedule,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  const flatListRef = useRef(null);

  // Generate dates for calendar (21 days before and after today)
  const dates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datesArray = [];
    const startOffset = -21;
    const endOffset = 21;

    for (let i = startOffset; i <= endOffset; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      datesArray.push(date);
    }

    return datesArray;
  }, []);

  // Find today's index for scrolling
  const todayIndex = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dates.findIndex(
      (date) => date.toDateString() === today.toDateString()
    );
  }, [dates]);

  // Scroll to today on mount
  useEffect(() => {
    if (flatListRef.current && todayIndex !== -1) {
      // Use setTimeout to ensure the FlatList is fully rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: todayIndex,
          animated: false,
          viewPosition: 0.3, // Center today's date in the view
        });
      }, 100);
    }
  }, [todayIndex]);

  // Helper to get routine for a specific date
  const getRoutineForDate = (date) => {
    if (!startDate || !patternLength || !schedule) {
      return null;
    }

    return planAPI.getRoutineForDate(date, startDate, patternLength, schedule);
  };

  // Format date for display
  const formatDate = (date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[date.getDay()];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return { dayName, dateString: `${month}/${day}` };
  };

  const isToday = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.toDateString() === today.toDateString();
  };

  const renderDateItem = ({ item: date }) => {
    const { dayName, dateString } = formatDate(date);
    const routine = getRoutineForDate(date);
    const hasWorkout = routine?.template_id;
    const today = isToday(date);

    return (
      <TouchableOpacity
        style={[styles.dateContainer, today && styles.todayContainer]}
        onPress={() => onDayPress && onDayPress(date, routine)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dayName, today && styles.todayText]}>
          {dayName}
        </Text>
        <Text style={[styles.dateText, today && styles.todayText]}>
          {date.getDate()}
        </Text>
        {hasWorkout && routine?.template_name && (
          <Text
            style={[styles.routineName, today && styles.todayText]}
            numberOfLines={2}
          >
            {routine.template_name}
          </Text>
        )}
        {!hasWorkout && (
          <Text
            style={[
              styles.routineName,
              styles.restText,
              today && styles.todayText,
            ]}
          >
            Rest
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const keyExtractor = (date) => date.toISOString();

  const getItemLayout = (data, index) => ({
    length: 90,
    offset: 90 * index,
    index,
  });

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderDateItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={todayIndex}
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure by scrolling to offset
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          });
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      height: 130,
      backgroundColor: "transparent",
    },
    listContent: {
      paddingHorizontal: Spacing.s,
    },
    dateContainer: {
      width: 85,
      alignItems: "center",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.s,
      marginHorizontal: 4,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    todayContainer: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
      borderWidth: 2,
    },
    dayName: {
      fontSize: FontSize.xsmall,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    dateText: {
      fontSize: FontSize.large,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    todayText: {
      color: "#FFFFFF",
    },
    routineName: {
      fontSize: FontSize.xsmall,
      color: colors.textPrimary,
      textAlign: "center",
      fontWeight: FontWeight.medium,
      paddingHorizontal: Spacing.xxs,
    },
    restText: {
      color: colors.textFaded,
      fontWeight: FontWeight.normal,
    },
  });

export default ScrollableCalendar;
