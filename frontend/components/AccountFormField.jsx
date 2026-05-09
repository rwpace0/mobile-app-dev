import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../state/SettingsContext";
import { useThemeColors } from "../constants/useThemeColors";
import { createStyles } from "../styles/settings.styles";

const AccountFormField = ({
  title,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  editable = true,
  error = false,
  showPassword,
  onTogglePassword,
}) => {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={styles.formField}>
      <Text style={styles.formFieldLabel}>{title}</Text>
      {secureTextEntry ? (
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[
              styles.formFieldInput,
              styles.passwordInput,
              error && styles.formFieldInputError,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaded}
            secureTextEntry={!showPassword}
            editable={editable}
          />
          <View style={styles.passwordIconsContainer}>
            {value && value.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => onChangeText("")}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.eyeIcon} onPress={onTogglePassword}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.formFieldInput,
              !editable && styles.formFieldInputDisabled,
              error && styles.formFieldInputError,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaded}
            secureTextEntry={false}
            editable={editable}
          />
          {value && value.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => onChangeText("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default AccountFormField;
