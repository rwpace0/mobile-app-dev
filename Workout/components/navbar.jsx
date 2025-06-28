import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "../styles/navbar.styles";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/ThemeContext";

const Navbar = ({ state, descriptors, navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        // icons based on route name
        let iconName;
        if (route.name === "Home") {
          iconName = isFocused ? "home" : "home-outline";
        } else if (route.name === "Start" || route.name === "ActiveWorkout") {
          iconName = isFocused ? "barbell" : "barbell-outline";
        } else if (route.name === "AddExercise") {
          iconName = isFocused ? "stats-chart" : "stats-chart-outline";
        } else if (route.name === "Profile") {
          iconName = isFocused ? "person" : "person-outline";
        } else if (route.name === "WorkoutHistory") {
          iconName = isFocused ? "stats-chart" : "stats-chart-outline";
        } else {
          iconName = isFocused ? "apps" : "apps-outline";
        }

        // hidden screens from the navbar
        if (
          route.name === "Login" ||
          route.name === "SignUp" ||
          route.name === "WorkoutActive" ||
          route.name === "RoutineCreate" ||
          route.name === "CreateExercise" ||
          route.name === "WorkoutDetail" ||
          route.name === "ExerciseDetail" ||
          route.name === "ViewExercises" ||
          route.name === "Settings" ||
          route.name === "AddExercise" ||
          route.name === "SettingsPage" ||
          route.name === "WorkoutEdit"
        ) {
          return null;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Get display name for the tab
        const getDisplayName = (routeName) => {
          if (routeName === "Start") return "Workout";
          if (routeName === "WorkoutHistory") return "History";
          return label;
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={
              isFocused
                ? [styles.tabItem, styles.tabItemActive]
                : styles.tabItem
            }
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? colors.primaryLight : colors.textFaded}
            />
            <Text style={isFocused ? styles.tabTextActive : styles.tabText}>
              {getDisplayName(route.name)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Navbar;
