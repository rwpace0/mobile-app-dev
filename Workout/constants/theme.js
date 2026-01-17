export const Spacing = {
  none: 0,
  xxxs: 2,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  xxxl: 64,
};

export const FontSize = {
  tiny: 10,
  small: 12,
  caption: 14,
  base: 16,
  medium: 18,
  large: 20,
  xlarge: 24,
  xxlarge: 28,
  title: 32,
  header: 40,
  header2: 48,
  timer: 56,

};

export const FontWeight = {
  thin: "300",
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
  heavy: "800",
};

export const FontFamily = {
  primary: "System", // default system font
};

export const LineHeight = {
  tight: 1.15, // For headers
  normal: 1.4, // For paragraph text
  relaxed: 1.6, // For longer texts
};

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 32,
  round: "50%", // circular elements
};

export const Shadow = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
};

// Z-index - for stacking
export const ZIndex = {
  base: 0,
  card: 10,
  modal: 50,
  toast: 100,
  overlay: 1000,
};

// Animation times
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};

export default {
  Spacing,
  FontSize,
  FontWeight,
  FontFamily,
  LineHeight,
  BorderRadius,
  Shadow,
  ZIndex,
  Animation,
};
