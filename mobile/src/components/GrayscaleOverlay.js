import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import useAppStore from '../store/useAppStore';

const GrayscaleOverlay = () => {
  const isConnected = useAppStore((s) => s.isConnected);
  const opacity = useSharedValue(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 350, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
      withTiming(0, { duration: isConnected ? 1200 : 500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.overlay, animatedStyle]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#000000',
    zIndex: 9999,
  },
});

export default GrayscaleOverlay;
