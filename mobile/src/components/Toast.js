import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';
import useAppStore from '../store/useAppStore';
import { FONTS } from '../constants/theme';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const BG_COLORS = {
  success: '#10B981',
  error: '#F43F5E',
  info: '#3B82F6',
};

const Toast = () => {
  const insets = useSafeAreaInsets();
  const toast = useAppStore((s) => s.toast);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toast) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(100, { duration: 300, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [toast]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  const Icon = ICONS[toast.type] || Info;
  const bgColor = BG_COLORS[toast.type] || '#333';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor, bottom: Math.max(insets.bottom, 8) + 90 },
        animStyle,
      ]}
      pointerEvents="none"
      testID="toast-notification"
    >
      <Icon size={18} color="#FFFFFF" />
      <Text style={styles.text} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default Toast;
