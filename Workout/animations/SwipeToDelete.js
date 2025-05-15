import React, { useRef, useCallback } from 'react';
import { Animated, PanResponder, View } from 'react-native';

const SwipeToDelete = ({ children, onDelete, style }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: 0
      });
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) { // Only allow left swipe
        pan.x.setValue(gestureState.dx);
        opacity.setValue(1 - Math.abs(gestureState.dx) / 200);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -100) { // Threshold for delete
        Animated.parallel([
          Animated.timing(pan.x, {
            toValue: -400,
            duration: 200,
            useNativeDriver: false
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false
          })
        ]).start(() => {
          onDelete();
        });
      } else {
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false
        }).start();
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: false
        }).start();
      }
    }
  });

  const animatedStyle = {
    transform: [{ translateX: pan.x }],
    opacity: opacity
  };

  return (
    <Animated.View
      style={[style, animatedStyle]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

export default SwipeToDelete; 