import React, { useMemo } from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { useTheme } from "../../state/SettingsContext";
import { createButtonStyles } from "../../styles/button.styles";
import { hapticLight } from "../../utils/hapticFeedback";
import { Spacing } from "../../constants/theme";

const VALID_VARIANTS = ["primary", "secondary", "danger", "outline"];

/**
 * Variant-based Button. Supports primary, secondary, danger, and outline.
 * @param {string} variant - "primary" | "secondary" | "danger" | "outline"
 * @param {string} [title] - Button label (prefer over children)
 * @param {React.ReactNode} [children] - Alternative to title
 * @param {React.ReactNode} [leftIcon] - Optional icon before label (or only content when no title)
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
  leftIcon,
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
  const hasLabel = label != null && label !== "";
  const iconOnly = leftIcon && !hasLabel;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator color={labelStyle?.color} size="small" />
      );
    }
    if (iconOnly) {
      return leftIcon;
    }
    if (leftIcon && hasLabel) {
      return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {leftIcon}
          <Text style={[labelStyle, textStyle, { marginLeft: Spacing.xs }]}>
            {label}
          </Text>
        </View>
      );
    }
    return <Text style={[labelStyle, textStyle]}>{label}</Text>;
  };

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
      {renderContent()}
    </Pressable>
  );
}
