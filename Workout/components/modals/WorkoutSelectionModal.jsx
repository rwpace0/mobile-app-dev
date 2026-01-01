import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomSheetStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import {
  FontSize,
  FontWeight,
  Spacing,
  BorderRadius,
} from "../../constants/theme";
import { format, parseISO } from "date-fns";
import { useWeight } from "../../utils/useWeight";
import { hapticLight, hapticMedium } from "../../utils/hapticFeedback";

const { height: screenHeight } = Dimensions.get("window");

const WorkoutSelectionModal = ({
  visible,
  onClose,
  selectedDate,
  workouts = [],
  onWorkoutSelect,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createBottomSheetStyles(isDark);
  const weight = useWeight();

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Pan responder for swipe to dismiss
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return (
        gestureState.dy > 0 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      );
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 150 || gestureState.vy > 0.5) {
        handleClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Format date for display
  const formatSelectedDate = (dateString) => {
    try {
      const date = parseISO(dateString + "T00:00:00");
      return format(date, "EEEE, MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Format duration from seconds to MM:SS or HH:MM:SS (same as active mini)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  };

  // Render workout item
  const renderWorkoutItem = ({ item: workout, index }) => {
    const duration = formatDuration(workout.duration || 0);
    const exerciseCount = workout.exercises?.length || 0;
    const totalSets =
      workout.exercises?.reduce((sum, exercise) => {
        return sum + (exercise.sets?.length || 0);
      }, 0) || 0;
    const isLastItem = index === workouts.length - 1;

    return (
      <TouchableOpacity
        style={[
          styles.actionItem,
          {
            marginBottom: isLastItem ? 0 : Spacing.xs,
            paddingVertical: Spacing.m,
          },
        ]}
        onPress={() => {
          onWorkoutSelect(workout.workout_id);
          handleClose();
        }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: Spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: FontSize.medium,
                fontWeight: FontWeight.semiBold,
                color: colors.textPrimary,
                flex: 1,
                marginRight: Spacing.s,
              }}
            >
              {workout.name || "Workout"}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: FontSize.small,
                color: colors.textSecondary,
                fontWeight: FontWeight.medium,
              }}
            >
              {duration}
            </Text>
            <Text
              style={{
                fontSize: FontSize.small,
                color: colors.textSecondary,
                fontWeight: FontWeight.medium,
              }}
            >
              {exerciseCount} exercises
            </Text>
            <Text
              style={{
                fontSize: FontSize.small,
                color: colors.textSecondary,
                fontWeight: FontWeight.medium,
              }}
            >
              {totalSets} sets
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={() => {
          hapticLight();
          handleClose();
        }}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle - draggable area */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* Title - also draggable */}
          <View style={styles.titleContainer} {...panResponder.panHandlers}>
            <Text style={styles.title}>{formatSelectedDate(selectedDate)}</Text>
          </View>

          {/* Workout List */}
          <View style={styles.actionsContainer}>
            <FlatList
              data={workouts}
              renderItem={renderWorkoutItem}
              keyExtractor={(item) => item.workout_id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={workouts.length > 4} // Only scroll if more than 4 items
            />
          </View>

          {/* Safe area spacing */}
          <View style={styles.safeAreaBottom} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default WorkoutSelectionModal;
