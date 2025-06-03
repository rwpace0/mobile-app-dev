import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/navbar.styles";

const Navbar = ({ state, descriptors, navigation }) => {
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
        } else if (route.name === "Login" || route.name === "SignUp") {
          iconName = isFocused ? "person" : "person-outline";
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
          route.name === "WorkoutDetail"
          
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
        // change hardcoded values
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={isFocused ? [styles.tabItem, styles.tabItemActive] : styles.tabItem}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isFocused ? "#47A3FF" : "#BBBBBB"}
            />
            <Text style={isFocused ? styles.tabTextActive : styles.tabText}>
              {route.name === "Start" ? "Workout" : label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Navbar;