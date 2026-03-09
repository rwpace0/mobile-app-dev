import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SelectDropdown = ({
  options,
  value,
  onSelect,
  placeholder,
  isOpen,
  onToggle,
  hasError = false,
  multiSelect = false,
  styles,
  colors,
}) => {
  const hasValue = multiSelect
    ? Array.isArray(value) && value.length > 0
    : !!value;

  const displayText = multiSelect
    ? hasValue
      ? value.join(", ")
      : placeholder
    : value || placeholder;

  const handleSelect = (option) => {
    if (multiSelect) {
      const current = Array.isArray(value) ? value : [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      onSelect(updated);
    } else {
      onSelect(option);
    }
  };

  const isSelected = (option) => {
    if (multiSelect) {
      return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdown,
          hasError && styles.inputError,
        ]}
        onPress={onToggle}
      >
        <Text
          style={{
            color: hasValue ? colors.textWhite : colors.textFaded,
            flex: 1,
          }}
        >
          {displayText}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textFaded}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={{ maxHeight: 200 }}>
            {options.map((option) => {
              const selected = isSelected(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownItem,
                    selected && styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                  {multiSelect && selected && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primaryBlue}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default SelectDropdown;
