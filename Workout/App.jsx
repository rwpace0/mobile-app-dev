import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from "./API/auth/authContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ActiveWorkoutProvider } from "./state/ActiveWorkoutContext";
import WelcomePage from "./pages/welcome";
import LoginPage from "./pages/login";
import SignUpPage from "./pages/signup";
import EmailVerification from "./pages/EmailVerification";
import ResetPassword from "./pages/resetPassword";
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

// Deep linking configuration
const linking = {
  prefixes: [
    'workout://',
    'exp://192.168.1.155:8081', // Development URL
    'https://192.168.1.155:8081', // Alternative development URL
  ],
  config: {
    screens: {
      // Auth screens - accessible globally for deep links
      Auth: {
        screens: {
          Welcome: 'auth/welcome',
          Login: 'auth/login',
          SignUp: 'auth/signup',
        },
      },
      // Email verification screen
      EmailVerification: 'auth/verify-email',
      // Reset password as modal (accessible from any state)
      ResetPassword: 'auth/reset-password',
      // Main app screens
      Main: {
        screens: {
          Tabs: {
            screens: {
              Start: 'start',
              WorkoutHistory: 'history',
              Profile: 'profile',
            },
          },
        },
      },
    },
  },
};

// Common screen options for slide animations
const slideFromRightOptions = {
  animation: 'slide_from_right',
  headerShown: false,
};

const modalOptions = {
  presentation: "fullScreenModal",
  animationTypeForReplace: "push",
  headerShown: false,
};

// Screen configuration for each stack - reduces duplication
const stackScreens = {
  profile: [
    { name: "ProfileMain", component: Profile },
    { name: "Settings", component: Settings, options: slideFromRightOptions },
    { name: "AccountSettings", component: AccountSettings, options: slideFromRightOptions },
    { name: "EditProfile", component: EditProfile, options: slideFromRightOptions },
    { name: "SettingsPage", component: SettingsPage, options: slideFromRightOptions },
    { name: "ViewExercises", component: ViewExercises, options: slideFromRightOptions },
  ],
  workoutHistory: [
    { name: "WorkoutHistoryMain", component: WorkoutHistory },
    { name: "WorkoutDetail", component: WorkoutDetail, options: slideFromRightOptions },
  ],
  start: [
    { name: "StartMain", component: startPage },
    { name: "ExerciseDetail", component: ExerciseDetail, options: slideFromRightOptions },
    { name: "ViewExercises", component: ViewExercises, options: slideFromRightOptions },
    { name: "RoutineDetail", component: RoutineDetail, options: slideFromRightOptions },
  ]
};

// Generic stack creator - reduces code duplication
const createStackNavigator = (screens) => () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {screens.map(({ name, component, options = {} }) => (
      <Stack.Screen 
        key={name}
        name={name} 
        component={component}
        options={options}
      />
    ))}
  </Stack.Navigator>
);

// Create stack navigators using the generic creator
const ProfileStack = createStackNavigator(stackScreens.profile);
const WorkoutHistoryStack = createStackNavigator(stackScreens.workoutHistory);
const StartStack = createStackNavigator(stackScreens.start);

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomePage} />
    <Stack.Screen name="Login" component={LoginPage} />
    <Stack.Screen name="SignUp" component={SignUpPage} />
    <Stack.Screen name="ResetPassword" component={ResetPassword} />
  </Stack.Navigator>
);

// Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{ headerShown: false }}
    tabBar={(props) => <Navbar {...props} />}
    initialRouteName="Start"
  >
    <Tab.Screen name="WorkoutHistory" component={WorkoutHistoryStack} />
    <Tab.Screen name="Start" component={StartStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Modal screens configuration
const modalScreens = [
  { name: "AddExercise", component: AddExercisePage },
  { name: "activeWorkout", component: ActiveWorkoutPage },
  { name: "RoutineCreate", component: RoutineCreate },
  { name: "EditTemplate", component: EditRoutine },
  { name: "CreateExercise", component: CreateExercise },
  { name: "WorkoutSettings", component: SettingsPage },
];

// Main Stack Navigator
const MainStack = () => {
  const { activeWorkout } = useActiveWorkout();

  const handleResumeWorkout = React.useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('activeWorkout');
    }
  }, []);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        
        {/* Modal screens */}
        {modalScreens.map(({ name, component }) => (
          <Stack.Screen
            key={name}
            name={name}
            component={component}
            options={modalOptions}
          />
        ))}
        
        {/* Special case screen */}
        <Stack.Screen 
          name="editWorkout" 
          component={editWorkout} 
          options={{ headerShown: false }}
        />
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

// Root Navigator with memoization
const RootNavigator = React.memo(() => {
  const { user, loading } = useAuth();
  const [initialURL, setInitialURL] = React.useState(null);

  // Handle initial deep link
  React.useEffect(() => {
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialURL(url);
      }
    };
    getInitialURL();
  }, []);

  // Handle deep links while app is running
  React.useEffect(() => {
    const handleDeepLink = ({ url }) => {
      handleURL(url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription?.remove();
  }, []);

  // Helper function to parse URL fragments (after #)
  const parseURLFragments = React.useCallback((url) => {
    const fragmentIndex = url.indexOf('#');
    if (fragmentIndex === -1) return {};
    
    const fragment = url.substring(fragmentIndex + 1);
    const params = {};
    
    fragment.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    
    return params;
  }, []);

  // Parse and handle URL navigation
  const handleURL = React.useCallback((url) => {
    if (!navigationRef.isReady()) return;

    const parsedURL = Linking.parse(url);

    // Parse both query params and URL fragments
    const queryParams = parsedURL.queryParams || {};
    const fragmentParams = parseURLFragments(url);
    const allParams = { ...queryParams, ...fragmentParams };

    // Only handle URLs that have valid paths - avoid processing empty/invalid URLs
    if (!parsedURL.path || parsedURL.path === '/') {
      return;
    }

    // Handle password reset links
    if (parsedURL.path === 'auth/reset-password' || parsedURL.path === '/--/auth/reset-password') {
      const { access_token, refresh_token, expires_in, expires_at, type, token_hash, token } = allParams;
      
      // Only navigate if we have the required parameters
      if (access_token && refresh_token && type === 'recovery') {
        const params = {
          access_token,
          refresh_token, 
          expires_in: expires_in || expires_at, // Supabase may use expires_at instead
          type,
          token_hash: token_hash || token || access_token
        };
        
        navigationRef.navigate('ResetPassword', params);
      }
      return;
    }

    // Handle email verification links
    if (parsedURL.path === 'auth/verify-email' || parsedURL.path === 'auth/welcome' || parsedURL.path === '/--/auth/welcome') {
      const { token_hash, type, token } = allParams;
      
      // Only navigate if we have the required parameters
      if ((token_hash || token) && type) {
        const params = {
          token_hash: token_hash || token,
          type
        };
        
        navigationRef.navigate('EmailVerification', params);
      }
      return;
    }
  }, [parseURLFragments]);

  // Handle initial URL when navigation is ready
  React.useEffect(() => {
    if (initialURL && navigationRef.isReady()) {
      handleURL(initialURL);
      setInitialURL(null); // Clear it so it doesn't run again
    }
  }, [initialURL, handleURL]);

  // Cleanup old files when user is authenticated
  React.useEffect(() => {
    if (user?.isAuthenticated) {
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
          <Stack.Screen name="EmailVerification" component={EmailVerification} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
      
      {/* Include ResetPassword as a modal that can be accessed from any state */}
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPassword}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
});

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ActiveWorkoutProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
        </ActiveWorkoutProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}