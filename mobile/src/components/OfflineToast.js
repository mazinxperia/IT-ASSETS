import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { FONTS } from '../constants/theme';
import useAppStore from '../store/useAppStore';

const OfflineToast = () => {
  const insets = useSafeAreaInsets();
  const offlineToast = useAppStore((s) => s.offlineToast);
  const translateX = useSharedValue(-220);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (offlineToast) {
      translateX.value = withSpring(52, { damping: 18, stiffness: 320 });
      opacity.value = withTiming(1, { duration: 100 });
      translateX.value = withDelay(2500, withTiming(-220, { duration: 300, easing: Easing.in(Easing.cubic) }));
      opacity.value = withDelay(2500, withTiming(0, { duration: 300 }));
    }
  }, [offlineToast]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toast, { bottom: Math.max(insets.bottom, 8) + 90 + 6 }, style]}>
      <WifiOff size={13} color="#fff" strokeWidth={2.5} />
      <Text style={[styles.text, { fontFamily: FONTS.semiBold }]}>Connect to backend</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    zIndex: 998,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  text: { color: '#fff', fontSize: 12 },
});

export default OfflineToast;
