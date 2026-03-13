import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

const NAVY = 'rgb(21, 32, 54)';

const OnboardingTopBar = ({ animController, onBack, onSkip }) => {
  const { top } = useSafeAreaInsets();
  const translateY = animController.current.interpolate({
    inputRange: [0, 0.2, 0.8, 1.0],
    outputRange: [-(60 + top), 0, 0, -(60 + top)],
  });
  const skipOpacity = animController.current.interpolate({
    inputRange: [0, 0.2, 0.6, 0.8],
    outputRange: [0, 1, 1, 0],
  });
  return (
    <Animated.View style={[styles.container, { marginTop: top, transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <ArrowLeft size={22} color={NAVY} />
      </TouchableOpacity>
      <Animated.View style={{ opacity: skipOpacity }}>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.5)' },
});

export default OnboardingTopBar;
