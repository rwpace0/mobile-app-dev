// Dark theme colors (current)
const darkTheme = {
  // base theme colors
  backgroundPrimary: "#121212", // main background
  backgroundSecondary: "#1A1A1A", // secondary background
  backgroundInput: "#1E1E1E", // input background
  backgroundCard: "#242424", // card background
  borderColor: "#2A2A2A", // divider lines

  // primary colors
  primaryBlue: "#007AFF", // iOS blue
  primaryLight: "#409CFF", // lighter iOS blue
  primaryDark: "#0062CC", // darker iOS blue

  // Text colors
  textPrimary: "#FFFFFF", // primary text
  textSecondary: "#BBBBBB", // secondary text
  textFaded: "#999999", // faded text
  placeholder: "#777777", // placeholder text
  textFooter: "#777777", // footer text
  textDisabled: "#555555", // disabled text
  textWhite: "#FFFFFF", // white text

  // accent colors
  accentGreen: "#4CD964", // success states
  accentRed: "#FF3B30", // error states
  accentOrange: "#FF9500", // warning states
  accentPurple: "#AF52DE", // secondary accent

  // opacity variants for overlays
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayMedium: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",

  // white overlay variants
  overlayWhite: "rgba(255, 255, 255, 0.1)",
  overlayWhiteMedium: "rgba(255, 255, 255, 0.2)",

  // state overlay variants
  successOverlay: "rgba(76, 217, 100, 0.2)",
  warningOverlay: "rgba(255, 235, 59, 0.2)",
  errorOverlay: "rgba(255, 59, 48, 0.1)",
  infoOverlay: "rgba(33, 150, 243, 0.1)",

  // iOS specific
  iosGray: "#AEAEB2", // iOS gray for buttons
};

// Light theme colors (iOS-like)
const lightTheme = {
  // base theme colors
  backgroundPrimary: "#FFFFFF", // main background
  backgroundSecondary: "#F2F2F7", // secondary background
  backgroundInput: "#FFFFFF", // input background
  backgroundCard: "#F2F2F7", // card background
  borderColor: "#E5E5EA", // divider lines

  // primary colors (same as dark)
  primaryBlue: "#007AFF", // iOS blue
  primaryLight: "#409CFF", // lighter iOS blue
  primaryDark: "#0062CC", // darker iOS blue

  // Text colors
  textPrimary: "#000000", // primary text
  textSecondary: "#3C3C43", // secondary text
  textFaded: "#8E8E93", // faded text
  placeholder: "#C7C7CC", // placeholder text
  textFooter: "#8E8E93", // footer text
  textDisabled: "#C7C7CC", // disabled text
  textWhite: "#FFFFFF", // white text

  // accent colors (same as dark)
  accentGreen: "#4CD964", // success states
  accentRed: "#FF3B30", // error states
  accentOrange: "#FF9500", // warning states
  accentPurple: "#AF52DE", // secondary accent

  // opacity variants for overlays
  overlayDark: "rgba(0, 0, 0, 0.4)",
  overlayMedium: "rgba(0, 0, 0, 0.3)",
  overlayLight: "rgba(0, 0, 0, 0.1)",

  // white overlay variants
  overlayWhite: "rgba(255, 255, 255, 0.1)",
  overlayWhiteMedium: "rgba(255, 255, 255, 0.2)",

  // state overlay variants
  successOverlay: "rgba(76, 217, 100, 0.2)",
  warningOverlay: "rgba(255, 235, 59, 0.2)",
  errorOverlay: "rgba(255, 59, 48, 0.1)",
  infoOverlay: "rgba(33, 150, 243, 0.1)",

  // iOS specific
  iosGray: "#8E8E93", // iOS gray for buttons
};

// Export function to get colors based on theme
export const getColors = (isDark = true) => {
  return isDark ? darkTheme : lightTheme;
};

// Export default as dark theme for backward compatibility
export default darkTheme;
