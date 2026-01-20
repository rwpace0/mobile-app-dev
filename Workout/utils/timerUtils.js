/**
 * Timer utility functions for formatting and parsing time values
 */

/**
 * Format seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (MM:SS) or "Off" if 0
 */
export const formatTime = (seconds) => {
  if (seconds === 0) return "Off";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Parse time input (supports seconds or MM:SS format)
 * @param {string} input - Time input string
 * @returns {number} Time in seconds
 */
export const parseTimeInput = (input) => {
  if (!input || input === "") return 0;
  const cleaned = input.trim();

  // If it contains a colon, parse as MM:SS
  if (cleaned.includes(":")) {
    const parts = cleaned.split(":");
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  }

  // Otherwise parse as seconds
  return parseInt(cleaned) || 0;
};

/**
 * Format set timer display (seconds to M:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (M:SS)
 */
export const formatSetTimerDisplay = (seconds) => {
  if (!seconds || seconds === 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format timer input value for display
 * If value is 1-2 digits, format as 00:XX (e.g., "30" -> "00:30")
 * @param {string} value - Timer input value
 * @param {string} defaultTimer - Default timer value to return if empty
 * @returns {string} Formatted timer value
 */
export const formatTimerInputDisplay = (value, defaultTimer = "3:00") => {
  if (!value || value === "") return defaultTimer;

  // If it already contains a colon, return as-is
  if (value.includes(":")) {
    return value;
  }

  // If it's 1-2 digits, format as 00:XX
  const numericValue = value.replace(/[^0-9]/g, "");
  if (numericValue.length <= 2 && numericValue.length > 0) {
    const seconds = parseInt(numericValue) || 0;
    return `00:${seconds.toString().padStart(2, "0")}`;
  }

  return value;
};
