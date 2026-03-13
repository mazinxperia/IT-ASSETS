import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { FONTS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const LOGO = require('../../assets/logo.png');

const BootSplashScreen = () => {
  const logoScale = useSharedValue(0.6);
  const logoOp = useSharedValue(0);
  const logoY = useSharedValue(12);
  const textOp = useSharedValue(0);
  const textY = useSharedValue(10);
  const tagOp = useSharedValue(0);

  useEffect(() => {
    // Logo bounces in
    logoScale.value = withDelay(
      100,
      withSpring(1, { damping: 20, stiffness: 180, overshootClamping: true })
    );
    logoOp.value = withDelay(
      100,
      withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) })
    );
    logoY.value = withDelay(
      100,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // App name slides up after logo
    textOp.value = withDelay(
      380,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );
    textY.value = withDelay(
      380,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // Tagline fades in last
    tagOp.value = withDelay(
      600,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOp.value,
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOp.value,
    transform: [{ translateY: textY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOp.value,
  }));

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoPill}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
      </Animated.View>

      {/* App name + tagline */}
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.appName}>AssetFlow</Text>
      </Animated.View>
      <Animated.View style={tagStyle}>
        <Text style={styles.tagline}>IT Asset Management</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    marginBottom: 24,
  },

  // Large dark rounded square — the logo has a black bg already
  // so this just gives it a nice frame + glow feel
  logoPill: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#111118',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },

  logoImage: {
    width: 68,
    height: 68,
  },

  textWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },

  appName: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },

  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: FONTS.regular,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

export default BootSplashScreen;
