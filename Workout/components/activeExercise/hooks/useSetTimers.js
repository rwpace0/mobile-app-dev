import { useState, useEffect, useRef, useMemo } from "react";
import { useSettings } from "../../../state/SettingsContext";
import { parseTimeInput, formatSetTimerDisplay } from "../../../utils/timerUtils";
import { hapticSuccess } from "../../../utils/hapticFeedback";

const DEFAULT_SET_TIMER = "3:00";

/**
 * Custom hook for managing set-level timers
 * @param {Array} sets - Array of sets
 * @param {Object} initialState - Initial state from restored workout
 * @returns {Object} Timer state and handlers
 */
export const useSetTimers = (initialSets, initialState) => {
  const { timerType } = useSettings();
  const [setTimers, setSetTimers] = useState(initialState?.setTimers || {});
  const [activeSetTimer, setActiveSetTimer] = useState(null);
  const [setTimerRemaining, setSetTimerRemaining] = useState({});
  const timerIntervalRef = useRef(null);
  const initializedSetIds = useRef(new Set());

  // Initialize set timers for initial sets only once
  useEffect(() => {
    if (timerType === "set" && initialSets.length > 0) {
      setSetTimers((prevTimers) => {
        const newTimers = { ...prevTimers };
        let hasChanges = false;
        initialSets.forEach((set) => {
          if (!initializedSetIds.current.has(set.id) && !newTimers[set.id]) {
            newTimers[set.id] = DEFAULT_SET_TIMER;
            initializedSetIds.current.add(set.id);
            hasChanges = true;
          }
        });
        return hasChanges ? newTimers : prevTimers;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set timer countdown effect
  useEffect(() => {
    if (activeSetTimer && timerType === "set") {
      const interval = setInterval(() => {
        setSetTimerRemaining((prev) => {
          const current = prev[activeSetTimer] || 0;
          if (current <= 1) {
            // Timer completed - format the stored timer value if needed
            setSetTimers((prevTimers) => {
              const currentTimerValue = prevTimers[activeSetTimer] || "";
              if (currentTimerValue && !currentTimerValue.includes(":")) {
                // If value is 1-2 digits, format it as 00:XX
                const numericValue = currentTimerValue.replace(/[^0-9]/g, "");
                if (numericValue.length <= 2 && numericValue.length > 0) {
                  const seconds = parseInt(numericValue) || 0;
                  const formatted = `00:${seconds.toString().padStart(2, "0")}`;
                  return {
                    ...prevTimers,
                    [activeSetTimer]: formatted,
                  };
                }
              }
              return prevTimers;
            });

            clearInterval(interval);
            setActiveSetTimer(null);
            hapticSuccess();
            return { ...prev, [activeSetTimer]: 0 };
          }
          return { ...prev, [activeSetTimer]: current - 1 };
        });
      }, 1000);

      timerIntervalRef.current = interval;

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
        }
      };
    }
  }, [activeSetTimer, timerType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Handle set timer value changes with auto-formatting to MM:SS
  const handleSetTimerChange = (setId, value) => {
    // Remove all non-numeric characters
    const sanitized = value.replace(/[^0-9]/g, "");

    if (sanitized === "") {
      setSetTimers((prev) => ({
        ...prev,
        [setId]: "",
      }));
      return;
    }

    let formatted;
    if (sanitized.length <= 2) {
      // 1-2 digits: just show the digits as-is (e.g., "3" -> "3", "30" -> "30")
      formatted = sanitized;
    } else {
      // 3+ digits: last 2 digits are seconds, rest are minutes
      // Insert colon naturally: "300" -> "3:00", "3000" -> "30:00"
      const secondsPart = sanitized.slice(-2);
      const minutesPart = sanitized.slice(0, -2);
      const minutes = parseInt(minutesPart) || 0;
      const seconds = parseInt(secondsPart);

      // Cap seconds at 59
      const validSeconds = Math.min(seconds, 59);
      // Cap minutes at 99 for reasonable limits
      const validMinutes = Math.min(minutes, 99);

      // Don't pad minutes with leading zero (e.g., "3:00" not "03:00")
      formatted = `${validMinutes}:${validSeconds.toString().padStart(2, "0")}`;
    }

    setSetTimers((prev) => ({
      ...prev,
      [setId]: formatted,
    }));
  };

  // Start timer for a set
  const startSetTimer = (setId) => {
    // Stop any existing timer first (only one timer active at a time)
    if (activeSetTimer && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      setActiveSetTimer(null);
    }

    const timerValue = setTimers[setId] || DEFAULT_SET_TIMER;
    const timerSeconds = parseTimeInput(timerValue);
    if (timerSeconds > 0) {
      setActiveSetTimer(setId);
      setSetTimerRemaining((prev) => ({
        ...prev,
        [setId]: timerSeconds,
      }));
    }
  };

  // Stop timer for a set
  const stopSetTimer = (setId) => {
    if (activeSetTimer === setId) {
      setActiveSetTimer(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Initialize timer for new set
  const initializeTimerForNewSet = (newSetId, lastSetTimer) => {
    if (timerType === "set" && !initializedSetIds.current.has(newSetId)) {
      const defaultTimer = lastSetTimer || DEFAULT_SET_TIMER;
      initializedSetIds.current.add(newSetId);
      setSetTimers((prev) => ({
        ...prev,
        [newSetId]: defaultTimer,
      }));
    }
  };

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when setTimers, activeSetTimer, or setTimerRemaining actually change
  return useMemo(() => ({
    setTimers,
    activeSetTimer,
    setTimerRemaining,
    handleSetTimerChange,
    startSetTimer,
    stopSetTimer,
    initializeTimerForNewSet,
    DEFAULT_SET_TIMER,
    formatSetTimerDisplay,
  }), [setTimers, activeSetTimer, setTimerRemaining]);
};
