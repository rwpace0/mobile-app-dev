import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ActiveWorkoutContext = createContext();

export const ActiveWorkoutProvider = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutTimer, setWorkoutTimer] = useState(null);

  // Timer for the active workout - optimized with useCallback
  useEffect(() => {
    let interval;
    if (activeWorkout) {
      interval = setInterval(() => {
        setActiveWorkout(prev => {
          if (prev) {
            return {
              ...prev,
              duration: prev.duration + 1
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

  const startWorkout = useCallback((workoutData) => {
    const newWorkout = {
      name: workoutData.name || `Workout on ${new Date().toLocaleDateString()}`,
      exercises: workoutData.exercises || [],
      exerciseStates: workoutData.exerciseStates || {},
      totalVolume: workoutData.totalVolume || 0,
      totalSets: workoutData.totalSets || 0,
      exerciseTotals: workoutData.exerciseTotals || {},
      duration: workoutData.duration || 0,
      startTime: Date.now(),
      ...workoutData,
    };
    
    setActiveWorkout(newWorkout);
  }, []);

  const updateWorkout = useCallback((updates) => {
    setActiveWorkout(prev => {
      if (prev) {
        const updated = { ...prev, ...updates };
        return updated;
      }
      return null;
    });
  }, []);

  const endWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    activeWorkout,
    startWorkout,
    updateWorkout,
    endWorkout,
    isWorkoutActive: !!activeWorkout,
  }), [activeWorkout, startWorkout, updateWorkout, endWorkout]);

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
}; 