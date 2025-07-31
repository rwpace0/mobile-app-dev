import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "../../styles/navbar.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { useNavigationState } from "@react-navigation/native";

// Configuration object to reduce code duplication
const ROUTE_CONFIG = {
  Profile: {
    nestedScreens: ['ProfileMain', 'Settings', 'AccountSettings', 'EditProfile', 'SettingsPage'],
    icon: { focused: 'person', unfocused: 'person-outline' },
    displayName: 'Profile'
  },
  WorkoutHistory: {
    nestedScreens: ['WorkoutHistoryMain', 'WorkoutDetail'],
    icon: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
    displayName: 'History'
  },
  Start: {
    nestedScreens: ['StartMain', 'ExerciseDetail', 'ViewExercises', 'RoutineDetail'],
    icon: { focused: 'barbell', unfocused: 'barbell-outline' },
    displayName: 'Workout'
  }
};

const VISIBLE_TABS = ['WorkoutHistory', 'Start', 'Profile'];

const Navbar = ({ state, navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  
  // Memoize current nested route calculation
  const currentNestedRoute = useMemo(() => {
    const currentTab = state.routes[state.index];
    if (currentTab?.state?.routes) {
      const nestedRoute = currentTab.state.routes[currentTab.state.index];
      return nestedRoute?.name;
    }
    return currentTab?.name;
  }, [state]);
  
  // Memoize parent tab calculation
  const getParentTab = useMemo(() => {
    return (routeName) => {
      for (const [tabName, config] of Object.entries(ROUTE_CONFIG)) {
        if (config.nestedScreens.includes(routeName)) {
          return tabName;
        }
      }
      return routeName;
    };
  }, []);

  const parentTab = getParentTab(currentNestedRoute);

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        // Only show visible tabs
        if (!VISIBLE_TABS.includes(route.name)) {
          return null;
        }

        const config = ROUTE_CONFIG[route.name];
        const isFocused = route.name === parentTab;
        const iconName = isFocused ? config.icon.focused : config.icon.unfocused;

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
              {config.displayName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default React.memo(Navbar);