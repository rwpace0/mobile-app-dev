import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./API/AuthContext";
import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import HomePage from "./pages/home";
import SignUpPage from "./pages/signup";
import EmailVerification from "./pages/EmailVerification";
import AddExercisePage from "./components/addExercise";
import WorkoutStartPage from "./pages/workoutStart";
import WorkoutActivePage from "./pages/workoutActive";
import RoutineCreate from "./pages/routineCreate";
import Navbar from "./components/navbar";
import CreateExercise from "./components/createExercise";
import LoadingScreen from "./components/LoadingScreen";
import WorkoutHistory from "./pages/WorkoutHistory";
import WorkoutDetail from "./pages/WorkoutDetail";
import ExerciseDetail from "./pages/exerciseDetail";
import ViewExercises from "./pages/viewExercises";
import Profile from "./pages/profile";

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
    <Tab.Screen name="AddExercise" component={AddExercisePage} />
    <Tab.Screen name="Start" component={WorkoutStartPage} />
    <Tab.Screen name="Profile" component={Profile} />
    <Tab.Screen name="WorkoutActive" component={WorkoutActivePage} />
    <Tab.Screen name="RoutineCreate" component={RoutineCreate} />
    <Tab.Screen name="CreateExercise" component={CreateExercise} />
    <Tab.Screen name="WorkoutHistory" component={WorkoutHistory} />
    <Tab.Screen name="WorkoutDetail" component={WorkoutDetail} />
    <Tab.Screen name="ExerciseDetail" component={ExerciseDetail} />
    <Tab.Screen name="ViewExercises" component={ViewExercises} />
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
        user.isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="EmailVerification" component={EmailVerification} />
        )
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
