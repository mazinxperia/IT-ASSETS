import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import useAppStore from '../../../store/useAppStore';

const NAVY = 'rgb(21, 32, 54)';

const DotIndicator = ({ index, selectedIndex }) => {
  const anim = useRef(new Animated.Value(index === 0 ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: index === selectedIndex ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedIndex, index]);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          width: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
          borderRadius: 4,
        },
      ]}
    />
  );
};

const OnboardingNextButton = ({ animController, onNext, currentPage }) => {
  const { bottom } = useSafeAreaInsets();
  const accentColor = useAppStore((s) => s.accentColor);
  const containerY = animController.current.interpolate({
    inputRange: [0, 0.2, 0.8, 1.0],
    outputRange: [120, 0, 0, 120],
  });
  const isLastConfig = currentPage === 4;
  const dotIndex = Math.max(0, currentPage - 1);
  return (
    <Animated.View style={[styles.container, { paddingBottom: 16 + bottom, transform: [{ translateY: containerY }] }]}>
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <DotIndicator key={i} index={i} selectedIndex={dotIndex} />
        ))}
      </View>
      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.85}
        style={[styles.arrowBtn, { backgroundColor: isLastConfig ? accentColor : NAVY }]}
        testID="onboarding-next-btn"
      >
        <ArrowRight size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: NAVY },
  dotActive: { backgroundColor: NAVY },
  dotInactive: { backgroundColor: NAVY },
  arrowBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});

export default OnboardingNextButton;
