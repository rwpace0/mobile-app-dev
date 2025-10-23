import React, { useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LongPressGestureHandler } from "react-native-gesture-handler";
import { getColors } from "../constants/colors";
import { createStyles } from "../styles/start.styles";
import { useTheme } from "../state/SettingsContext";

const FolderCard = ({
  folder,
  routines,
  onPress,
  onOptionsPress,
  onRoutinePress,
  onRoutineOptions,
  onStartRoutine,
  onRoutineLongPress,
  onRemoveFromFolder,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const [isExpanded, setIsExpanded] = useState(false);

  const folderRoutines = routines.filter((routine) =>
    folder.routineIds.includes(routine.template_id)
  );

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.folderContainer}>
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.folderHeader}
        activeOpacity={0.7}
      >
        <View style={styles.folderTitleRow}>
          <Ionicons
            name={isExpanded ? "folder-open" : "folder"}
            size={24}
            color={colors.primaryBlue}
          />
          <Text style={styles.folderName}>{folder.name}</Text>
          <View style={styles.folderRoutineCount}>
            <Text style={styles.folderRoutineCountText}>
              {folderRoutines.length}
            </Text>
          </View>
        </View>
        <View style={styles.folderHeaderRight}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress(folder);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {isExpanded && folderRoutines.length > 0 && (
        <View style={styles.folderContent}>
          {folderRoutines.map((routine) => (
            <LongPressGestureHandler
              key={routine.template_id}
              onHandlerStateChange={(event) =>
                onRoutineLongPress(event, routine)
              }
              minDurationMs={500}
            >
              <Animated.View style={styles.folderRoutineCard}>
                <TouchableOpacity
                  onPress={() => onRoutinePress(routine)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateName}>{routine.name}</Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onRoutineOptions(routine);
                      }}
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.templateExercises}>
                    {routine.exercises.map((ex) => ex.name).join(" • ")}
                  </Text>
                  <TouchableOpacity
                    style={styles.startRoutineButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      onStartRoutine(routine);
                    }}
                  >
                    <Text style={styles.startRoutineText}>Start Routine</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            </LongPressGestureHandler>
          ))}
        </View>
      )}

      {isExpanded && folderRoutines.length === 0 && (
        <View style={styles.folderContent}>
          <Text style={styles.emptyFolderText}>
            No routines in this folder. Long press a routine to add it here.
          </Text>
        </View>
      )}
    </View>
  );
};

export default FolderCard;
