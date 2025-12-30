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
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomSheetStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { Spacing, BorderRadius, FontSize, FontWeight } from "../../constants/theme";

const { height: screenHeight } = Dimensions.get("window");

const FilterModal = ({
  visible,
  onClose,
  title,
  options = [],
  selectedValue,
  onSelect,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createBottomSheetStyles(isDark);

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [scrollOffset, setScrollOffset] = useState(0);

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

  // Pan responder for swipe to dismiss - only when list is at top or on handle/title
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to downward swipes when list is scrolled to top
      // or when swiping from handle/title area
      const isDownwardSwipe = gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      const isAtTop = scrollOffset <= 0;
      return isDownwardSwipe && isAtTop;
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

  // Pan responder for handle and title area - always swipeable
  const handlePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
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

  const handleSelect = (value) => {
    onSelect(value);
    handleClose();
  };

  const renderOption = ({ item }) => {
    const isSelected = selectedValue === item;
    const isAny = item === null;

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: Spacing.m,
          paddingHorizontal: Spacing.m,
          backgroundColor: colors.backgroundCard,
          marginBottom: Spacing.xs,
          borderRadius: BorderRadius.md,
        }}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text
          style={{
            color: isSelected ? colors.primaryBlue : colors.textPrimary,
            fontSize: FontSize.base,
            fontWeight: isSelected ? FontWeight.semiBold : FontWeight.regular,
          }}
        >
          {isAny ? "Any" : item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={colors.primaryBlue} />
        )}
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
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: backdropOpacity },
        ]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer} {...handlePanResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {title && (
            <View style={styles.titleContainer} {...handlePanResponder.panHandlers}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}

          <View style={styles.actionsContainer}>
            <FlatList
              data={[null, ...options]}
              renderItem={renderOption}
              keyExtractor={(item, index) => item || `any-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: Spacing.xxxl + Spacing.l,
              }}
              onScroll={(event) => {
                setScrollOffset(event.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
            />
          </View>

          <View style={styles.safeAreaBottom} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default FilterModal;

