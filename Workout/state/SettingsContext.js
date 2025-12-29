import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Backwards compatibility hook for existing theme usage
export const useTheme = () => {
  const settings = useSettings();
  return {
    theme: settings.theme,
    actualTheme: settings.actualTheme,
    changeTheme: settings.changeTheme,
    isLight: settings.isLight,
    isDark: settings.isDark,
  };
};

const DEFAULT_SETTINGS = {
  // Theme settings (migrated from ThemeContext)
  theme: "system", // 'system', 'light', 'dark'

  // Workout settings
  showPreviousPerformance: true,
  autoRestTimer: true,
  showRir: true,
  showWeightHistory: true,
  showNotes: true,
  restTimerEnabled: true,
  timerType: "exercise", // 'exercise' or 'set'

  // Account settings
  emailNotifications: false,
  workoutReminders: false,
  achievementAlerts: false,

  // Privacy settings
  shareWorkouts: false,
  showProfile: true,
  allowComments: false,

  // Units settings
  weightUnit: "lbs", // 'kg' or 'lbs'
  distanceUnit: "miles", // 'kilometers' or 'miles'
  bodyMeasurementUnit: "in", // 'cm' or 'in'
  use24Hour: true,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [actualTheme, setActualTheme] = useState("dark"); // the actual theme being used
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    loadSavedSettings();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (settings.theme === "system") {
        setActualTheme(colorScheme === "light" ? "light" : "dark");
      }
    });

    return () => subscription?.remove();
  }, [settings.theme]);

  // Update actual theme when theme setting changes
  useEffect(() => {
    if (settings.theme === "system") {
      const systemTheme = Appearance.getColorScheme();
      setActualTheme(systemTheme === "light" ? "light" : "dark");
    } else {
      setActualTheme(settings.theme);
    }
  }, [settings.theme]);

  const loadSavedSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("app_settings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with defaults to handle new settings
        setSettings((prev) => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      await AsyncStorage.setItem("app_settings", JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving setting:", error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(
        "app_settings",
        JSON.stringify(updatedSettings)
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  // Backwards compatibility for theme functions
  const changeTheme = async (newTheme) => {
    await updateSetting("theme", newTheme);
  };

  const value = useMemo(
    () => ({
      // Settings state
      settings,
      isLoaded,

      // Settings update functions
      updateSetting,
      updateSettings,

      // Theme-specific values for backwards compatibility
      theme: settings.theme,
      actualTheme,
      changeTheme,
      isLight: actualTheme === "light",
      isDark: actualTheme === "dark",

      // Convenience getters for specific settings
      showPreviousPerformance: settings.showPreviousPerformance,
      autoRestTimer: settings.autoRestTimer,
      showRir: settings.showRir,
      showWeightHistory: settings.showWeightHistory,
      showNotes: settings.showNotes,
      restTimerEnabled: settings.restTimerEnabled,
      timerType: settings.timerType,

      emailNotifications: settings.emailNotifications,
      workoutReminders: settings.workoutReminders,
      achievementAlerts: settings.achievementAlerts,
      shareWorkouts: settings.shareWorkouts,
      showProfile: settings.showProfile,
      allowComments: settings.allowComments,
      weightUnit: settings.weightUnit,
      distanceUnit: settings.distanceUnit,
      bodyMeasurementUnit: settings.bodyMeasurementUnit,
      use24Hour: settings.use24Hour,
    }),
    [
      settings,
      isLoaded,
      updateSetting,
      updateSettings,
      actualTheme,
      changeTheme,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Backwards compatibility export
export const ThemeProvider = SettingsProvider;

export default SettingsContext;
