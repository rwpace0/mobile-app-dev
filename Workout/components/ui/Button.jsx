import React, { useMemo } from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { createButtonStyles } from "../../styles/button.styles";
import { hapticLight } from "../../utils/hapticFeedback";

const VALID_VARIANTS = ["primary", "secondary", "danger"];

/**
 * Variant-based Button. Supports primary, secondary, and danger.
 * @param {string} variant - "primary" | "secondary" | "danger"
 * @param {string} [title] - Button label (prefer over children)
 * @param {React.ReactNode} [children] - Alternative to title
 * @param {function} [onPress]
 * @param {boolean} [disabled]
 * @param {boolean} [loading]
 * @param {object} [style] - One-off container style override
 * @param {object} [textStyle] - One-off label style override
 */
export function Button({
  variant = "primary",
  title,
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const { isDark } = useTheme();
  const styles = useMemo(() => createButtonStyles(isDark), [isDark]);

  const effectiveVariant = VALID_VARIANTS.includes(variant) ? variant : "primary";
  const containerStyle = styles[effectiveVariant];
  const textStyleKey = `${effectiveVariant}Text`;
  const labelStyle = styles[textStyleKey];
  const disabledStyle = styles[`${effectiveVariant}Disabled`];

  const handlePress = (event) => {
    if (disabled || loading) return;
    hapticLight();
    onPress?.(event);
  };

  const label = title ?? children;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        isDisabled && disabledStyle,
        pressed && !isDisabled && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelStyle?.color} size="small" />
      ) : (
        <Text style={[labelStyle, textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}
