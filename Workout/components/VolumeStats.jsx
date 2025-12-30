import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";
import { Spacing, FontSize, FontWeight, BorderRadius } from "../constants/theme";

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
          {muscles.map((muscle, index) => (
            <View
              key={muscle}
              style={[
                styles.volumeItem,
                index % 2 === 0 ? styles.volumeItemEven : styles.volumeItemOdd,
              ]}
            >
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
      paddingTop: Spacing.m,
      paddingBottom: Spacing.m,
    },
    categorySection: {
      marginBottom: Spacing.l,
    },
    categoryTitle: {
      fontSize: FontSize.small,
      fontWeight: FontWeight.medium,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: Spacing.s,
      paddingHorizontal: Spacing.m,
    },
    categoryMuscles: {
      // Remove gap, use padding on items instead
    },
    volumeItem: {
      width: "100%",
      paddingVertical: Spacing.m,
      paddingHorizontal: Spacing.m,
    },
    volumeItemEven: {
      backgroundColor: colors.backgroundPrimary,
    },
    volumeItemOdd: {
      backgroundColor: colors.backgroundCard,
    },
    volumeItemContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },
    muscleLabel: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.medium,
      color: colors.textPrimary,
    },
    volumeValue: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.primaryBlue,
    },
    volumeBar: {
      height: 6,
      backgroundColor: colors.borderColor,
      borderRadius: BorderRadius.sm,
      overflow: "hidden",
    },
    volumeBarFill: {
      height: "100%",
      backgroundColor: colors.primaryBlue,
      borderRadius: BorderRadius.sm,
    },
  });

export default VolumeStats;
