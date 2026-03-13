import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import useAppStore from '../store/useAppStore';

const { width } = Dimensions.get('window');

const AnimatedTabWrapper = ({ children, myIndex }) => {
  const isFocused = useIsFocused();
  const initialized = useRef(false);
  const translateX = useSharedValue(myIndex === 0 ? 0 : width);
  const opacity = useSharedValue(myIndex === 0 ? 1 : 0);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const { tabIndex, prevTabIndex } = useAppStore.getState();
    const goingForward = tabIndex > prevTabIndex;

    if (isFocused) {
      translateX.value = goingForward ? width * 0.3 : -width * 0.3;
      opacity.value = 0;
      translateX.value = withTiming(0, {
        duration: 380,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      opacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateX.value = withTiming(goingForward ? -width * 0.3 : width * 0.3, {
        duration: 380,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      });
      opacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export default AnimatedTabWrapper;
