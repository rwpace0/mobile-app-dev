import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./API/authContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ActiveWorkoutProvider } from "./state/ActiveWorkoutContext";
import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import EmailVerification from "./pages/EmailVerification";
import AddExercisePage from "./components/addExercise";
import startPage from "./pages/start";
import ActiveWorkoutPage from "./pages/activeWorkout";
import RoutineCreate from "./pages/routineCreate";
import Navbar from "./components/navbar";
import CreateExercise from "./components/createExercise";
import LoadingScreen from "./components/LoadingScreen";
import WorkoutHistory from "./pages/workoutHistory";
import WorkoutDetail from "./pages/workoutDetail";
import editWorkout from "./pages/editWorkout";
import ExerciseDetail from "./pages/exerciseDetail";
import ViewExercises from "./pages/viewExercises";
import Profile from "./pages/profile";
import Settings from "./pages/settings";
import SettingsPage from "./pages/settingsPages";
import RoutineDetail from "./components/routineDetail";
import ActiveMini from "./components/activeMini";
import { useActiveWorkout } from "./state/ActiveWorkoutContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create navigation reference for global navigation
const navigationRef = createNavigationContainerRef();

// Auth Stack (Welcome, Login, Signup)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomePage} />
    <Stack.Screen name="Login" component={LoginPage} />
    <Stack.Screen name="SignUp" component={SignUpPage} />
  </Stack.Navigator>
);

// Tab Navigator for main app sections - only contains main tab screens
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <Navbar {...props} />}
    initialRouteName="Start"
  >
    <Tab.Screen name="WorkoutHistory" component={WorkoutHistory} />
    <Tab.Screen name="Start" component={startPage} />
    <Tab.Screen name="Profile" component={Profile} />
  </Tab.Navigator>
);

// Main Stack Navigator for detail/modal screens with ActiveMini overlay
const MainStack = () => {
  const { activeWorkout, endWorkout } = useActiveWorkout();

  const handleResumeWorkout = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('activeWorkout');
    }
  };

  const handleDiscardWorkout = () => {
    endWorkout();
  };

  // Debug logging

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="AddExercise"
          component={AddExercisePage}
          options={{
            presentation: "fullScreenModal",
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen
          name="activeWorkout"
          component={ActiveWorkoutPage}
          options={{
            presentation: "fullScreenModal",
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen
          name="RoutineCreate"
          component={RoutineCreate}
          options={{
            presentation: "fullScreenModal",
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen name="CreateExercise" component={CreateExercise} />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetail} />
        <Stack.Screen name="editWorkout" component={editWorkout} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
        <Stack.Screen name="ViewExercises" component={ViewExercises} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="SettingsPage" component={SettingsPage} />
        <Stack.Screen name="RoutineDetail" component={RoutineDetail} />
      </Stack.Navigator>
      
      {activeWorkout && (
        <ActiveMini
          visible={true}
          onResume={handleResumeWorkout}
          onDiscard={handleDiscardWorkout}
          workoutName={activeWorkout.name || `Workout on ${new Date().toLocaleDateString()}`}
          duration={activeWorkout.duration || 0}
        />
      )}
    </>
  );
};

// Root Navigator
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
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerification}
          />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ActiveWorkoutProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
        </ActiveWorkoutProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
