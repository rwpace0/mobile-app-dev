import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomSheetStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "../../constants/theme";
import { hapticLight, hapticSelection } from "../../utils/hapticFeedback";

const { height: screenHeight } = Dimensions.get("window");

const RestTimerModal = ({ visible, onClose, onSelectTime, currentTime }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createBottomSheetStyles(isDark);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Generate time intervals: Off, then 15s to 300s (5min) in 15s increments
  const generateTimeOptions = () => {
    const options = [{ label: "Off", seconds: 0 }];
    for (let seconds = 15; seconds <= 300; seconds += 15) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const label =
        secs === 0
          ? `${mins}:00`
          : `${mins}:${secs.toString().padStart(2, "0")}`;
      options.push({ label, seconds });
    }
    return options;
  };

  const timeOptions = generateTimeOptions();
  const [selectedIndex, setSelectedIndex] = useState(
    timeOptions.findIndex((opt) => opt.seconds === currentTime)
  );

  const formatTime = (seconds) => {
    if (seconds === 0) return "Off";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

      // Scroll to selected item after animation
      const currentIndex = timeOptions.findIndex(
        (opt) => opt.seconds === currentTime
      );
      setSelectedIndex(currentIndex);
      setTimeout(() => {
        if (scrollViewRef.current && currentIndex >= 0) {
          scrollViewRef.current.scrollTo({
            y: currentIndex * 50,
            animated: true,
          });
        }
      }, 350);
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

  const pickerStyles = StyleSheet.create({
    pickerContainer: {
      height: 250,
      position: "relative",
    },
    pickerScrollView: {
      flex: 1,
    },
    pickerItem: {
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    pickerItemText: {
      fontSize: FontSize.large,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
    },
    pickerItemTextSelected: {
      fontSize: 28,
      color: colors.textPrimary,
      fontWeight: FontWeight.bold,
    },
    pickerHighlight: {
      position: "absolute",
      top: 100,
      left: 0,
      right: 0,
      height: 50,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.borderColor,
      backgroundColor: colors.overlayWhite,
      pointerEvents: "none",
    },
    pickerPadding: {
      height: 100,
    },
    buttonContainer: {
      flexDirection: "row",
      paddingHorizontal: Spacing.l,
      paddingVertical: Spacing.m,
      gap: Spacing.m,
    },
    button: {
      flex: 1,
      paddingVertical: Spacing.m,
      borderRadius: BorderRadius.md,
      alignItems: "center",
    },
    cancelButton: {
      backgroundColor: colors.overlayWhite,
    },
    confirmButton: {
      backgroundColor: colors.primaryBlue,
    },
    buttonText: {
      fontSize: FontSize.base,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    confirmButtonText: {
      color: colors.textWhite,
    },
  });

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / 50);
    const newIndex = Math.max(0, Math.min(index, timeOptions.length - 1));

    // Trigger haptic on selection change
    if (newIndex !== selectedIndex) {
      hapticSelection();
    }

    setSelectedIndex(newIndex);
  };

  const handleConfirm = () => {
    hapticLight();
    if (selectedIndex >= 0 && selectedIndex < timeOptions.length) {
      onSelectTime(timeOptions[selectedIndex].seconds);
    }
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Rest Timer</Text>
          </View>

          {/* iOS-style picker */}
          <View style={pickerStyles.pickerContainer}>
            {/* Highlight bar */}
            <View style={pickerStyles.pickerHighlight} />

            {/* Scrollable time options */}
            <ScrollView
              ref={scrollViewRef}
              style={pickerStyles.pickerScrollView}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <View style={pickerStyles.pickerPadding} />
              {timeOptions.map((time, index) => (
                <TouchableOpacity
                  key={time.seconds}
                  style={pickerStyles.pickerItem}
                  onPress={() => {
                    setSelectedIndex(index);
                    scrollViewRef.current?.scrollTo({
                      y: index * 50,
                      animated: true,
                    });
                  }}
                >
                  <Text
                    style={[
                      pickerStyles.pickerItemText,
                      index === selectedIndex &&
                        pickerStyles.pickerItemTextSelected,
                    ]}
                  >
                    {time.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={pickerStyles.pickerPadding} />
            </ScrollView>
          </View>

          {/* Buttons */}
          <View style={pickerStyles.buttonContainer}>
            <TouchableOpacity
              style={[pickerStyles.button, pickerStyles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={pickerStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pickerStyles.button, pickerStyles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text
                style={[
                  pickerStyles.buttonText,
                  pickerStyles.confirmButtonText,
                ]}
              >
                Set Timer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Safe area spacing */}
          <View style={styles.safeAreaBottom} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default RestTimerModal;
