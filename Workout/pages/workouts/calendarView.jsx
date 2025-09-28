import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { CalendarList } from 'react-native-calendars';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import workoutAPI from "../../API/workoutAPI";
import Header from "../../components/static/header";
import WorkoutSelectionModal from "../../components/modals/WorkoutSelectionModal";
import { createStyles } from "../../styles/calendar.styles";
import { getColors } from "../../constants/colors";
import { BorderRadius, FontWeight, FontSize } from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import { useWeight } from "../../utils/useWeight";
import { format, parseISO, isToday, startOfMonth, endOfMonth } from 'date-fns';

const CalendarViewPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutsData, setWorkoutsData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  // Load all workouts for calendar (we'll load more data for scrollable calendar)
  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current date and calculate date range (12 months back, current month only)
      const today = new Date();
      const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, 1);
      const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Fetch workouts for current and past months only
      const response = await workoutAPI.getWorkoutsCursor({
        dateFrom: twelveMonthsAgo.toISOString().split('T')[0],
        dateTo: endOfCurrentMonth.toISOString().split('T')[0],
        limit: 500, // Get workouts for the past 12 months
      });

      // Group workouts by date
      const workoutsByDate = {};
      response.workouts.forEach(workout => {
        const dateKey = workout.date_performed.split('T')[0]; // YYYY-MM-DD format
        if (!workoutsByDate[dateKey]) {
          workoutsByDate[dateKey] = [];
        }
        workoutsByDate[dateKey].push(workout);
      });

      setWorkoutsData(workoutsByDate);

      // Create marked dates for calendar - solid blue circles around workout day numbers
      const marked = {};
      Object.keys(workoutsByDate).forEach(date => {
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: colors.primaryBlue,
              borderRadius: BorderRadius.round,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
            },
            text: {
              color: colors.textWhite,
              fontWeight: FontWeight.semiBold,
              fontSize: FontSize.base,
            },
          },
        };
      });

      setMarkedDates(marked);
    } catch (err) {
      console.error("Failed to load workouts:", err);
      setError(err.message || "Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [colors]);

  // Load workouts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  // Handle day selection - smart interaction based on workout count
  const onDayPress = useCallback((day) => {
    const dateKey = day.dateString;
    const dayWorkouts = workoutsData[dateKey] || [];
    
    if (dayWorkouts.length === 0) {
      // No workouts on this day, do nothing
      return;
    }
    
    if (dayWorkouts.length === 1) {
      // Single workout - navigate directly to workout detail
      navigation.navigate("WorkoutDetail", { 
        workout_id: dayWorkouts[0].workout_id 
      });
      return;
    }
    
    // Multiple workouts - show modal
    setSelectedDate(dateKey);
    setSelectedDateWorkouts(dayWorkouts);
    setModalVisible(true);
  }, [workoutsData, markedDates, colors, navigation]);

  // Handle visible month change for stats
  const onVisibleMonthsChange = useCallback((months) => {
    // CalendarList callback when visible months change
    // We can use this to update stats if needed
  }, []);

  // Navigate to workout detail
  const navigateToWorkout = useCallback((workoutId) => {
    navigation.navigate("WorkoutDetail", { workout_id: workoutId });
  }, [navigation]);

  // Handle workout selection from modal
  const handleWorkoutSelect = useCallback((workoutId) => {
    navigateToWorkout(workoutId);
  }, [navigateToWorkout]);


  if (loading && !Object.keys(workoutsData).length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Calendar" 
          leftComponent={{
            type: 'down',
            onPress: () => navigation.goBack()
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} />
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Calendar" 
        leftComponent={{
          type: 'down',
          onPress: () => navigation.goBack()
        }}
      />
      
      {/* Vertically Scrollable Calendar */}
      <View style={styles.calendarContainer}>
        <CalendarList
          onDayPress={onDayPress}
          onVisibleMonthsChange={onVisibleMonthsChange}
          markedDates={markedDates}
          markingType="custom"
          theme={styles.calendarTheme}
          hideExtraDays={true}
          firstDay={1} // Start week on Monday
          horizontal={false}
          pagingEnabled={false}
          scrollEnabled={true}
          showScrollIndicator={true}
          pastScrollRange={12}
          futureScrollRange={0}
        />
      </View>

      {/* Workout Selection Modal */}
      <WorkoutSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate}
        workouts={selectedDateWorkouts}
        onWorkoutSelect={handleWorkoutSelect}
      />

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadWorkouts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CalendarViewPage;
