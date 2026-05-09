import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Animated, 
  Dimensions, 
  PanResponder,
  TouchableWithoutFeedback 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBottomSheetStyles } from "../../styles/modals.styles";
import { getColors } from "../../constants/colors";
import { useTheme } from "../../state/SettingsContext";
import { hapticLight } from "../../utils/hapticFeedback";

const { height: screenHeight } = Dimensions.get('window');

const BottomSheetModal = ({ 
  visible, 
  onClose, 
  title, 
  actions = [], 
  showHandle = true 
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createBottomSheetStyles(isDark);
  
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

  const renderAction = (action, index) => {
    const isDestructive = action.destructive;
    const isDisabled = action.disabled;
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.actionItem,
          isDestructive && styles.destructiveAction,
          isDisabled && styles.disabledAction,
          index === 0 && styles.firstAction,
          index === actions.length - 1 && styles.lastAction
        ]}
        onPress={() => {
          if (!isDisabled && action.onPress) {
            hapticLight();
            action.onPress();
            handleClose();
          }
        }}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <View style={styles.actionContent}>
          {action.icon && (
            <Ionicons 
              name={action.icon} 
              size={22} 
              color={
                isDisabled 
                  ? colors.textDisabled 
                  : isDestructive 
                    ? colors.accentRed 
                    : colors.textPrimary
              } 
            />
          )}
          <Text 
            style={[
              styles.actionText,
              isDestructive && styles.destructiveText,
              isDisabled && styles.disabledText
            ]}
          >
            {action.title}
          </Text>
        </View>
        {action.showChevron && (
          <Ionicons 
            name="chevron-forward" 
            size={18} 
            color={colors.textSecondary} 
          />
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
          { opacity: backdropOpacity }
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {
          hapticLight();
          handleClose();
        }}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
        
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
          {...panResponder.panHandlers}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}
          
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => renderAction(action, index))}
          </View>
          
          {/* Safe area spacing */}
          <View style={styles.safeAreaBottom} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default BottomSheetModal; 