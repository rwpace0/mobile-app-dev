import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../state/SettingsContext";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/activeExercise.styles";
import { hapticLight } from "../../utils/hapticFeedback";
import exercisesAPI from "../../API/exercisesAPI";

const ExerciseHeader = ({ exercise, drag, isActive, onDeletePress }) => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [exerciseDetails, setExerciseDetails] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchExerciseDetails = async () => {
      try {
        const details = await exercisesAPI.getExerciseById(
          exercise.exercise_id
        );
        setExerciseDetails(details);
      } catch (error) {
        console.error("Failed to fetch exercise details:", error);
      }
    };

    fetchExerciseDetails();
  }, [exercise.exercise_id]);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.exerciseTitleRow}
        onLongPress={drag || undefined}
        onPress={() => {
          hapticLight();
          navigation.navigate("ExerciseDetail", {
            exerciseId: exercise.exercise_id,
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.exerciseIconContainer}>
          {exerciseDetails?.local_media_path && !imageError ? (
            <Image
              source={{
                uri: `file://${FileSystem.cacheDirectory}app_media/exercises/${exerciseDetails.local_media_path}`,
              }}
              style={styles.exerciseImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name="barbell" size={24} color={colors.textPrimary} />
          )}
        </View>
        <Text style={[styles.exerciseName, isActive && { opacity: 0.5 }]}>
          {exerciseDetails?.name || ""}
        </Text>
      </TouchableOpacity>

      {!isActive && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDeletePress}
        >
          <Ionicons name="trash-outline" size={24} color={colors.accentRed} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ExerciseHeader;
