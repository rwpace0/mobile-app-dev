import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";

const VolumeStats = ({ volumeData }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors, isDark);

  if (!volumeData || Object.keys(volumeData).length === 0) {
    return null;
  }

  // Categorize muscle groups
  const categories = {
    Torso: ["chest", "back", "shoulders", "abs", "core", "lats", "traps"],
    Limbs: ["biceps", "triceps", "forearms"],
    Legs: ["quads", "hamstrings", "glutes", "calves"],
  };

  // Organize muscles by category
  const organizedMuscles = {};
  Object.keys(volumeData).forEach((muscle) => {
    let categoryFound = false;
    for (const [category, muscles] of Object.entries(categories)) {
      if (muscles.includes(muscle)) {
        if (!organizedMuscles[category]) {
          organizedMuscles[category] = [];
        }
        organizedMuscles[category].push(muscle);
        categoryFound = true;
        break;
      }
    }
    // If no category found, add to "Other"
    if (!categoryFound) {
      if (!organizedMuscles["Other"]) {
        organizedMuscles["Other"] = [];
      }
      organizedMuscles["Other"].push(muscle);
    }
  });

  const maxVolume = Math.max(...Object.values(volumeData));

  const renderCategory = (category, muscles) => {
    if (!muscles || muscles.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        <View style={styles.categoryMuscles}>
          {muscles.map((muscle) => (
            <View key={muscle} style={styles.volumeItem}>
              <View style={styles.volumeItemContent}>
                <Text style={styles.muscleLabel}>{muscle}</Text>
                <Text style={styles.volumeValue}>{volumeData[muscle]}</Text>
              </View>
              <View style={styles.volumeBar}>
                <View
                  style={[
                    styles.volumeBarFill,
                    {
                      width: `${Math.min(
                        (volumeData[muscle] / maxVolume) * 100,
                        100
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {["Torso", "Limbs", "Legs", "Other"].map((category) =>
        renderCategory(category, organizedMuscles[category])
      )}
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      backgroundColor: colors.backgroundCard,
      borderRadius: 16,
    },
    categorySection: {
      marginBottom: 20,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    categoryMuscles: {
      gap: 12,
    },
    volumeItem: {
      width: "100%",
    },
    volumeItemContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    muscleLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    volumeValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primaryBlue,
    },
    volumeBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    volumeBarFill: {
      height: "100%",
      backgroundColor: colors.primaryBlue,
      borderRadius: 3,
    },
  });

export default VolumeStats;
