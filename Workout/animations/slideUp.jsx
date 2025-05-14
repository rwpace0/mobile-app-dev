import React, { useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  Animated, 
  PanResponder, 
  Dimensions, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import activeStyles from "../styles/active.styles";
import colors from "../constants/colors";
import { BorderRadius, Spacing } from "../constants/theme";

const { height } = Dimensions.get("window");

const SlideUp = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const panY = useRef(new Animated.Value(height)).current;
  const translateY = panY;
  
  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: height,
    duration: 300,
  });

  const minimizeAnim = Animated.timing(panY, {
    toValue: height - 100,
    duration: 300,
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        panY.setValue(Math.max(0, gestureState.dy));
      },
      onPanResponderRelease: (e, gestureState) => {
        if(gestureState.dy > 100) {
          if(gestureState.dy > height / 3) {
            // If dragged more than a third of screen height, close it
            closeAnim.start(() => onClose());
          } else { 
            // Otherwise minimize
            minimizeAnim.start();
          }
        } else if (gestureState.dy < -100) {
          // If dragged up, show full panel
          resetPositionAnim.start();
        } else if (Math.abs(gestureState.dy) < 20) {
          // If it's a small movement (like a tap), toggle between states
          if (panY._value > height / 2) {
            resetPositionAnim.start();
          } else {
            minimizeAnim.start();
          }
        } else {
          // Reset to the nearest position
          if (panY._value > height / 2) {
            minimizeAnim.start();
          } else {
            resetPositionAnim.start();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      resetPositionAnim.start();
    }
  }, [visible]);

  const handleAddExercise = () => {
    console.log("Add exercise");
    // navigation.navigate("ExercisesPage");
  };

  const handleDiscard = () => {
    console.log("Discard workout");
    closeAnim.start(() => onClose());
  };

  const handleFinish = () => {
    console.log("Finish workout");
    // Save workout and navigate home
    closeAnim.start(() => onClose());
    // navigation.navigate("WorkoutSummaryPage");
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      <View 
        style={styles.dragHandle} 
        {...panResponder.panHandlers}
      >
        <View style={styles.dragIndicator} />
      </View>

      <SafeAreaView style={activeStyles.container}>
        <View style={activeStyles.header}>
          <TouchableOpacity onPress={() => minimizeAnim.start()}>
            <Ionicons name="chevron-down-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={activeStyles.headerTitle}>Log Workout</Text>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={activeStyles.finishButton}>Finish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={activeStyles.content}>
          <View style={activeStyles.statsContainer}>
            <View style={activeStyles.statItem}>
              <Text style={activeStyles.statLabel}>Duration</Text>
              <Text style={activeStyles.statValue}>4s</Text>
            </View>
            <View style={activeStyles.statItem}>
              <Text style={activeStyles.statLabel}>Volume</Text>
              <Text style={activeStyles.statValue}>0 kg</Text>
            </View>
            <View style={activeStyles.statItem}>
              <Text style={activeStyles.statLabel}>Sets</Text>
              <Text style={activeStyles.statValue}>0</Text>
            </View>
          </View>

          <View style={activeStyles.emptyWorkoutContainer}>
            <View style={activeStyles.iconContainer}>
              <Ionicons name="barbell-outline" size={42} color={colors.textLight} />
            </View>
            <Text style={activeStyles.getStartedText}>Get started</Text>
            <Text style={activeStyles.instructionText}>Add an exercise to start your workout</Text>
            
            <TouchableOpacity 
              style={activeStyles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={20} color={colors.textWhite} />
              <Text style={activeStyles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={activeStyles.footer}>
          <TouchableOpacity 
            style={activeStyles.settingsButton}
            onPress={() => console.log("Settings")}
          >
            <Text style={activeStyles.settingsText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={activeStyles.discardButton}
            onPress={handleDiscard}
          >
            <Text style={activeStyles.discardText}>Discard Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Tab that shows when minimized */}
      <Animated.View 
        style={[
          styles.minimizedTab,
          { 
            opacity: translateY.interpolate({
              inputRange: [height - 150, height - 100],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            })
          }
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragIndicator} />
        <Text style={styles.minimizedTabText}>Workout in Progress</Text>
        <Ionicons name="chevron-up-outline" size={20} color={colors.textWhite} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: height,
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  dragHandle: {
    width: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: colors.textLight,
    borderRadius: 5,
  },
  minimizedTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: colors.backgroundDark,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
  },
  minimizedTabText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SlideUp;