import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const EASING = Easing.bezier(0.4, 0.0, 0.2, 1);

const SlideModal = ({ visible, children }) => {
  const slideX = useSharedValue(width);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideX.value = width;
      slideX.value = withTiming(0, { duration: 300, easing: EASING });
    } else if (mounted) {
      slideX.value = withTiming(width, { duration: 260, easing: EASING }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default SlideModal;
