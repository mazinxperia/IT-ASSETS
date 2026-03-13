import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const ShimmerBox = ({ width, height, borderRadius = 8, style }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(0.3, { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        animStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard = ({ colors }) => (
  <View style={[styles.card, { backgroundColor: colors?.card || '#16161e' }]}>
    <View style={styles.row}>
      <ShimmerBox width={42} height={42} borderRadius={12} />
      <View style={styles.textGroup}>
        <ShimmerBox width="70%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
        <ShimmerBox width="45%" height={11} borderRadius={5} />
      </View>
    </View>
  </View>
);

export const SkeletonStatCard = ({ colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors?.card || '#16161e' }]}>
    <ShimmerBox width="50%" height={12} borderRadius={5} style={{ marginBottom: 12 }} />
    <ShimmerBox width="60%" height={32} borderRadius={8} style={{ marginBottom: 8 }} />
    <ShimmerBox width="40%" height={10} borderRadius={5} />
  </View>
);

export const SkeletonList = ({ count = 5, colors }) => (
  <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} colors={colors} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    marginLeft: 12,
  },
  statCard: {
    borderRadius: 14,
    padding: 18,
    flex: 1,
    margin: 6,
  },
});

export default ShimmerBox;
