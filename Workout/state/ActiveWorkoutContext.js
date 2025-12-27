import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AppState } from "react-native";
import { activeWorkoutStorage } from "../API/local/activeWorkoutStorage";

const ActiveWorkoutContext = createContext();

export const ActiveWorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Initialize storage and restore any existing workout on app start
  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        await activeWorkoutStorage.initialize();
        const restoredWorkout = await activeWorkoutStorage.loadActiveWorkout();

        if (restoredWorkout) {
          console.log(
            "[ActiveWorkoutContext] Restored active workout from storage"
          );
          setActiveWorkout(restoredWorkout);
        }
      } catch (error) {
        console.error(
          "[ActiveWorkoutContext] Failed to initialize workout:",
          error
        );
      } finally {
        setIsInitialized(true);
      }
    };

    initializeWorkout();
  }, []);

  // Timer for the active workout - updates every second for smooth display
  const durationRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Capture startTime when workout becomes active
    if (activeWorkout && activeWorkout.startTime) {
      startTimeRef.current = activeWorkout.startTime;
    } else {
      startTimeRef.current = null;
    }
  }, [activeWorkout?.startTime]);

  useEffect(() => {
    let interval;
    if (activeWorkout && startTimeRef.current) {
      interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor(
          (currentTime - startTimeRef.current) / 1000
        );
        durationRef.current = elapsedSeconds;

        // Update state every second for smooth duration display
        setActiveWorkout((prev) => {
          if (prev && prev.startTime) {
            return {
              ...prev,
              duration: elapsedSeconds,
            };
          }
          return prev;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [!!activeWorkout]); // Only depend on whether activeWorkout exists, not its contents

  // App state change handler for automatic saving
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        // App came to foreground - refresh duration from storage
        if (activeWorkout) {
          try {
            const refreshedWorkout =
              await activeWorkoutStorage.loadActiveWorkout();
            if (refreshedWorkout) {
              setActiveWorkout(refreshedWorkout);
            }
          } catch (error) {
            console.error(
              "[ActiveWorkoutContext] Failed to refresh workout on foreground:",
              error
            );
          }
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - save current state
        if (activeWorkout) {
          try {
            await activeWorkoutStorage.saveActiveWorkout(activeWorkout);
          } catch (error) {
            console.error(
              "[ActiveWorkoutContext] Failed to save workout on background:",
              error
            );
          }
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [activeWorkout, appState]);

  const startWorkout = useCallback(async (workoutData) => {
    const now = Date.now();
    const newWorkout = {
      name: workoutData.name || `Workout on ${new Date().toLocaleDateString()}`,
      exercises: workoutData.exercises || [],
      exerciseStates: workoutData.exerciseStates || {},
      totalVolume: workoutData.totalVolume || 0,
      totalSets: workoutData.totalSets || 0,
      exerciseTotals: workoutData.exerciseTotals || {},
      duration: 0, // Always start at 0
      startTime: now, // Real timestamp when workout started
      ...workoutData,
    };

    try {
      await activeWorkoutStorage.saveActiveWorkout(newWorkout);
      setActiveWorkout(newWorkout);
      console.log("[ActiveWorkoutContext] New workout started and saved");
    } catch (error) {
      console.error(
        "[ActiveWorkoutContext] Failed to save new workout:",
        error
      );
      // Still set the workout in memory even if save fails
      setActiveWorkout(newWorkout);
    }
  }, []);

  const updateWorkout = useCallback(async (updates) => {
    setActiveWorkout((prev) => {
      if (prev) {
        const updated = {
          ...prev,
          ...updates,
          // Don't override startTime from updates
          startTime: prev.startTime,
        };

        // Save to storage asynchronously - don't block UI updates
        activeWorkoutStorage.saveActiveWorkout(updated).catch((error) => {
          console.error(
            "[ActiveWorkoutContext] Failed to save workout update:",
            error
          );
        });

        return updated;
      }
      return null;
    });
  }, []);

  const endWorkout = useCallback(async () => {
    try {
      await activeWorkoutStorage.clearActiveWorkout();
      setActiveWorkout(null);
      console.log(
        "[ActiveWorkoutContext] Workout ended and cleared from storage"
      );
    } catch (error) {
      console.error(
        "[ActiveWorkoutContext] Failed to clear workout from storage:",
        error
      );
      // Still clear from memory even if storage clear fails
      setActiveWorkout(null);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      activeWorkout,
      startWorkout,
      updateWorkout,
      endWorkout,
      isWorkoutActive: !!activeWorkout,
      isInitialized, // Expose initialization state
    }),
    [activeWorkout, startWorkout, updateWorkout, endWorkout, isInitialized]
  );

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error(
      "useActiveWorkout must be used within an ActiveWorkoutProvider"
    );
  }
  return context;
};
