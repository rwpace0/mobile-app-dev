import React, { useState } from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";

const ExerciseImage = ({ exercise, colors, styles }) => {
  const [imageError, setImageError] = useState(false);

  const imagePath = exercise.local_media_path
    ? `${FileSystem.cacheDirectory}app_media/exercises/${exercise.local_media_path}`
    : null;

  return (
    <View style={styles.exerciseIconContainer}>
      {imagePath && !imageError ? (
        <Image
          source={{ uri: `file://${imagePath}` }}
          style={styles.exerciseImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Ionicons name="barbell" size={24} color={colors.textPrimary} />
      )}
    </View>
  );
};

export default ExerciseImage;
