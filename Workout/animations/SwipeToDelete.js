import React, { useRef } from 'react';
import { Animated, PanResponder, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const DELETE_BUTTON_WIDTH = 80;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH * 0.6;

const SwipeToDelete = ({ children, onDelete, style, deleteButtonColor = '#FF3B30' }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 5 && gestureState.dx < 0;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: 0
      });
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        const newX = Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH);
        pan.x.setValue(newX);
        
        const progress = Math.abs(newX) / DELETE_BUTTON_WIDTH;
        deleteButtonOpacity.setValue(progress);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        Animated.spring(pan.x, {
          toValue: -DELETE_BUTTON_WIDTH,
          useNativeDriver: false,
          tension: 100,
          friction: 8
        }).start();
        Animated.spring(deleteButtonOpacity, {
          toValue: 1,
          useNativeDriver: false
        }).start();
      } else {
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8
        }).start();
        Animated.spring(deleteButtonOpacity, {
          toValue: 0,
          useNativeDriver: false
        }).start();
      }
    }
  });

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(deleteButtonOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      })
    ]).start(() => {
      onDelete();
    });
  };

  return (
    <View style={{ width: '100%', position: 'relative' }}>
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
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[style, { transform: [{ translateX: pan.x }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default SwipeToDelete; 