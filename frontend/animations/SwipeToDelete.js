import React, { useRef, useState } from 'react';
import { Animated, PanResponder, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const DELETE_BUTTON_WIDTH = 80;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH * 0.4; // 40% of delete button width (32px)

const SwipeToDelete = ({ children, onDelete, style, deleteButtonColor = '#FF3B30' }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes with some threshold
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
    },
    
    onPanResponderGrant: () => {
      // Don't auto-close when starting a new gesture - let user control it
      // This prevents interference with left swipes
    },
    
    onPanResponderMove: (_, gestureState) => {
      if (isAnimating) return; // Prevent interference during animations
      
      // Calculate new position based on current position + gesture delta
      const currentX = translateX._value;
      let newX = currentX + gestureState.dx;
      
      // Constrain movement - only allow left swipe to reveal delete
      newX = Math.max(newX, -DELETE_BUTTON_WIDTH);
      newX = Math.min(newX, 0);
      
      // Update position
      translateX.setValue(newX);
      
      // Update delete button opacity based on reveal progress
      const progress = Math.abs(newX) / DELETE_BUTTON_WIDTH;
      deleteButtonOpacity.setValue(Math.min(progress, 1));
    },
    
    onPanResponderRelease: (_, gestureState) => {
      if (isAnimating) return; // Prevent interference during animations
      
      const currentX = translateX._value;
      const velocity = gestureState.vx;
      const swipeDistance = Math.abs(currentX);
      
      // Determine target based on position and velocity
      let targetX = 0;
      let targetOpacity = 0;
      
      // Improved logic with better thresholds
      const hasSignificantRightwardVelocity = velocity > 0.5;
      const hasSignificantLeftwardVelocity = velocity < -0.5;
      const isHalfwayOpen = swipeDistance > DELETE_BUTTON_WIDTH / 2;
      
      // Decision logic:
      if (hasSignificantRightwardVelocity) {
        // Strong rightward swipe - always close
        targetX = 0;
        targetOpacity = 0;
      } else if (hasSignificantLeftwardVelocity) {
        // Strong leftward swipe - always open
        targetX = -DELETE_BUTTON_WIDTH;
        targetOpacity = 1;
      } else if (isHalfwayOpen) {
        // Past halfway point with low velocity - snap to open
        targetX = -DELETE_BUTTON_WIDTH;
        targetOpacity = 1;
      } else {
        // Less than halfway with low velocity - snap to closed
        targetX = 0;
        targetOpacity = 0;
      }
      
      setIsAnimating(true);
      
      // Use spring animation for smoother feel
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          useNativeDriver: false,
          tension: 200,
          friction: 25,
          velocity: velocity,
        }),
        Animated.timing(deleteButtonOpacity, {
          toValue: targetOpacity,
          duration: 200,
          useNativeDriver: false
        })
      ]).start(() => {
        setIsAnimating(false);
      });
    }
  });

  const handleDelete = () => {
    if (isAnimating) return; // Prevent multiple delete calls
    
    setIsAnimating(true);
    
    // Animate item sliding out completely before calling onDelete
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -screenWidth,
        duration: 250,
        useNativeDriver: false
      }),
      Animated.timing(deleteButtonOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false
      })
    ]).start(() => {
      setIsAnimating(false);
      onDelete();
    });
  };

  return (
    <View style={{ width: '100%', position: 'relative' }}>
      {/* Delete Button */}
      <Animated.View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: DELETE_BUTTON_WIDTH,
          backgroundColor: deleteButtonColor,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: deleteButtonOpacity,
          zIndex: 1
        }}
      >
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          activeOpacity={0.7}
          disabled={isAnimating}
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <Animated.View
        style={[
          style,
          {
            transform: [{ translateX }],
            zIndex: 2
          }
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default SwipeToDelete;