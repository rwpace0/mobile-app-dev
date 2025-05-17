import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginPage from "./pages/login";
import HomePage from "./pages/home";
import SignUpPage from "./pages/signup";
import DisplayPage from "./components/display";
import WorkoutStartPage from "./pages/workoutStart";
import WorkoutActivePage from "./pages/workoutActive";
import RoutineCreate from "./pages/routineCreate";
import Navbar from "./components/navbar";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <Navbar {...props} />}
      >
        <Tab.Screen name="Home" component={HomePage} />
        <Tab.Screen name="Login" component={LoginPage} />
        <Tab.Screen name="SignUp" component={SignUpPage} />
        <Tab.Screen name="Display" component={DisplayPage} />
        <Tab.Screen name="Start" component={WorkoutStartPage} />
        <Tab.Screen name="WorkoutActive" component={WorkoutActivePage} />
        <Tab.Screen name="RoutineCreate" component={RoutineCreate} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
