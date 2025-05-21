import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import HomePage from "./pages/home";
import SignUpPage from "./pages/signup";
import DisplayPage from "./components/display";
import WorkoutStartPage from "./pages/workoutStart";
import WorkoutActivePage from "./pages/workoutActive";
import RoutineCreate from "./pages/routineCreate";
import Navbar from "./components/navbar";
import CreateExercise from "./components/createExercise";
import LoadingScreen from "./components/LoadingScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// auth Stack (Welcome, Login, Signup)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomePage} />
    <Stack.Screen name="Login" component={LoginPage} />
    <Stack.Screen name="SignUp" component={SignUpPage} />
  </Stack.Navigator>
);

// main App Stack (Tabs)
const MainStack = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <Navbar {...props} />}
  >
    <Tab.Screen name="Home" component={HomePage} />
    <Tab.Screen name="Display" component={DisplayPage} />
    <Tab.Screen name="Start" component={WorkoutStartPage} />
    <Tab.Screen name="WorkoutActive" component={WorkoutActivePage} />
    <Tab.Screen name="RoutineCreate" component={RoutineCreate} />
    <Tab.Screen name="CreateExercise" component={CreateExercise} />
  </Tab.Navigator>
);

// root Navigator
const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
