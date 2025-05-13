import * as React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import LoginPage from "./pages/login";
import HomePage from "./pages/home";
import SignUpPage from "./pages/signup";
import DisplayPage from "./components/display";
import StartPage from "./pages/workoutStart";
import WorkoutStartPage from "./pages/workoutStart";
import WorkoutActivePage from "./pages/workoutActive";

const Stack = createNativeStackNavigator();

export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="SignUp" component={SignUpPage} />
        <Stack.Screen name="Display" component={DisplayPage} />
        <Stack.Screen name="Start" component={WorkoutStartPage} />
        <Stack.Screen name="ActiveWorkout" component={WorkoutActivePage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

