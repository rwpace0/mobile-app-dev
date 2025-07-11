import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";
import { AuthProvider, useAuth } from "./API/auth/authContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ActiveWorkoutProvider } from "./state/ActiveWorkoutContext";
import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import EmailVerification from "./pages/EmailVerification";
import AddExercisePage from "./pages/exercises/addExercise";
import startPage from "./pages/start";
import ActiveWorkoutPage from "./pages/workouts/activeWorkout";
import RoutineCreate from "./pages/templates/routineCreate";
import EditRoutine from "./pages/templates/editRoutine";
import Navbar from "./components/static/navbar";
import CreateExercise from "./pages/exercises/createExercise";
import LoadingScreen from "./components/static/LoadingScreen";
import WorkoutHistory from "./pages/workouts/workoutHistory";
import WorkoutDetail from "./pages/workouts/workoutDetail";
import editWorkout from "./pages/workouts/editWorkout";
import ExerciseDetail from "./pages/exercises/exerciseDetail";
import ViewExercises from "./pages/exercises/viewExercises";
import Profile from "./pages/settings/profile";
import Settings from "./pages/settings/settings";
import SettingsPage from "./pages/settings/settingsPages";
import AccountSettings from "./pages/settings/accountSettings";
import EditProfile from "./pages/settings/editProfile";
import RoutineDetail from "./pages/templates/routineDetail";
import ActiveMini from "./components/activeMini";
import { useActiveWorkout } from "./state/ActiveWorkoutContext";
import { mediaAPI } from "./API/mediaAPI";

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
        <Stack.Screen
          name="EditTemplate"
          component={EditRoutine}
          options={{
            presentation: "fullScreenModal",
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen name="CreateExercise" component={CreateExercise} options={{
    presentation: "fullScreenModal",
    animationTypeForReplace: "push",
  }}/>
        <Stack.Screen
          name="WorkoutSettings"
          component={SettingsPage}
          options={{
            presentation: "fullScreenModal",
            animationTypeForReplace: "push",
          }}
        />
        <Stack.Screen name="WorkoutDetail" component={WorkoutDetail} />
        <Stack.Screen name="editWorkout" component={editWorkout} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
        <Stack.Screen name="ViewExercises" component={ViewExercises} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="SettingsPage" component={SettingsPage} />
        <Stack.Screen name="AccountSettings" component={AccountSettings} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="RoutineDetail" component={RoutineDetail} />
      </Stack.Navigator>
      
      {activeWorkout && (
        <ActiveMini
          visible={true}
          onResume={handleResumeWorkout}
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

  // Cleanup old files when user is authenticated
  React.useEffect(() => {
    if (user?.isAuthenticated) {
      // Run cleanup after a short delay to avoid blocking initial app load
      const cleanup = async () => {
        try {
          await mediaAPI.cleanupOldFiles();
        } catch (error) {
          console.error('Failed to cleanup old files:', error);
        }
      };

      const timeoutId = setTimeout(cleanup, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [user?.isAuthenticated]);

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
