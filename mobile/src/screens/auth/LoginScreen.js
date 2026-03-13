// ============================================================
// AssetFlow — LoginScreen — Final
// Split layout: accent top half, white card bottom
// No jumping, clean inputs, dynamic color
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, Image,
  Pressable, ActivityIndicator, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, withSpring,
  Easing, interpolateColor, interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { authApi, primeApiCache } from '../../services/api';
import { getColors, FONTS } from '../../constants/theme';

const LOGO   = require('../../../assets/logo.png');
const { height: SH } = Dimensions.get('window');
const ENTER  = { duration: 400, easing: Easing.bezier(0.05, 0.7, 0.1, 1.0) };
const STD    = { duration: 180, easing: Easing.bezier(0.2, 0, 0, 1) };
const SPRING = { damping: 22, stiffness: 380 };

// ─── Input with label above ───────────────────────────────────
const Input = ({ label, value, onChangeText, secureTextEntry, keyboardType = 'default',
  returnKeyType = 'next', onSubmitEditing, autoCapitalize = 'none',
  autoCorrect = false, trailingIcon, colors, testID }) => {
  const [focused, setFocused] = useState(false);
  const fa = useSharedValue(0);
  useEffect(() => { fa.value = withTiming(focused ? 1 : 0, STD); }, [focused]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(fa.value, [0, 1], [colors.outlineVariant, colors.primary]),
    borderWidth: interpolate(fa.value, [0, 1], [1.5, 2]),
  }));

  return (
    <View style={styles.inputWrap}>
      <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>
        {label}
      </Text>
      <Animated.View style={[styles.inputBox, { backgroundColor: colors.surface }, boxStyle]}>
        <TextInput
          style={[styles.inputText, { color: colors.onSurface, fontFamily: FONTS.regular }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          testID={testID}
        />
        {trailingIcon && <View style={styles.inputTrail}>{trailingIcon}</View>}
      </Animated.View>
    </View>
  );
};

// ─── Icon Button ──────────────────────────────────────────────
const IconBtn = ({ onPress, icon: Icon, colors }) => {
  const sc = useSharedValue(1);
  const s  = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <Animated.View style={s}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { sc.value = withSpring(0.82, SPRING); }}
        onPressOut={() => { sc.value = withSpring(1, SPRING); }}
        hitSlop={14}
        android_ripple={{ color: colors.primary + '33', borderless: true, radius: 22 }}
      >
        <Icon size={22} color={colors.onSurfaceVariant} />
      </Pressable>
    </Animated.View>
  );
};

// ─── Filled Button ────────────────────────────────────────────
const FillBtn = ({ label, onPress, loading, colors, testID }) => {
  const sc  = useSharedValue(1);
  const sop = useSharedValue(0);
  const cs  = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const ss  = useAnimatedStyle(() => ({ opacity: sop.value }));
  return (
    <Animated.View style={[{ borderRadius: 14 }, cs]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { sc.value = withSpring(0.97, SPRING); sop.value = withTiming(0.1, STD); }}
        onPressOut={() => { sc.value = withSpring(1, SPRING);   sop.value = withTiming(0, STD); }}
        disabled={loading}
        android_ripple={{ color: colors.onPrimary + '44' }}
        style={[styles.fillBtn, { backgroundColor: colors.primary }]}
        testID={testID}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 14, backgroundColor: '#fff' }, ss]} pointerEvents="none" />
        {loading
          ? <ActivityIndicator size={22} color={colors.onPrimary} />
          : <Text style={[styles.fillBtnText, { color: colors.onPrimary, fontFamily: FONTS.semiBold }]}>{label}</Text>
        }
      </Pressable>
    </Animated.View>
  );
};

// ─── Screen ───────────────────────────────────────────────────
export default function LoginScreen() {
  const setToken    = useAppStore((s) => s.setToken);
  const backendUrl  = useAppStore((s) => s.backendUrl);
  const setUser     = useAppStore((s) => s.setUser);
  const showToast   = useAppStore((s) => s.showToast);
  const theme       = useAppStore((s) => s.theme);
  const accentColor = useAccentColor();
  const isConnected = useAppStore((s) => s.isConnected);
  const colors      = getColors(theme, accentColor, isConnected);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  // Animations
  const hOp = useSharedValue(0); const hY = useSharedValue(-30);
  const cOp = useSharedValue(0); const cY = useSharedValue(60);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    // Header slides down
    hOp.value = withDelay(80,  withTiming(1, ENTER));
    hY.value  = withDelay(80,  withTiming(0, ENTER));
    // Card slides up
    cOp.value = withDelay(200, withTiming(1, ENTER));
    cY.value  = withDelay(200, withTiming(0, ENTER));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: hOp.value, transform: [{ translateY: hY.value }] }));
  const cardStyle   = useAnimatedStyle(() => ({
    opacity: cOp.value,
    transform: [{ translateY: cY.value }, { translateX: shakeX.value }],
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { showToast('Please enter email and password', 'error'); return; }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await authApi.login(email.trim(), password);
      setToken(res.data.token);
      primeApiCache(backendUrl, res.data.token);
      setUser(res.data.user);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Invalid email or password', 'error');
      shakeX.value = withSequence(
        withTiming(-10, { duration: 40 }), withTiming(10, { duration: 40 }),
        withTiming(-6,  { duration: 40 }), withTiming(6,  { duration: 40 }),
        withTiming(0,   { duration: 40 })
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setLoading(false); }
  };

  // ── Layout colors
  // Top half: primary (your accent) — rich, punchy
  // Bottom / card: surface (clean white/dark)
  const topBg  = colors.primary;
  const botBg  = colors.background;
  const cardBg = colors.surfaceContainerLow || colors.surface;

  return (
    <View style={styles.root}>

      {/* Fixed top colored section */}
      <View style={[styles.topBg, { backgroundColor: topBg }]} />

      {/* Fixed bottom section */}
      <View style={[styles.botBg, { backgroundColor: botBg }]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.layout}>

            {/* ── Header (on colored bg) ── */}
            <Animated.View style={[styles.header, headerStyle]}>
              {/* Logo */}
              <View style={[styles.logoBg, { backgroundColor: colors.onPrimary + '22' }]}>
                <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={[styles.brand, { color: colors.onPrimary, fontFamily: FONTS.bold }]}>
                AssetFlow
              </Text>
              <View style={styles.headText}>
                <Text style={[styles.headline, { color: colors.onPrimary, fontFamily: FONTS.bold }]}>
                  Sign in
                </Text>
                <Text style={[styles.subhead, { color: colors.onPrimary + 'BB', fontFamily: FONTS.regular }]}>
                  Use your AssetFlow account
                </Text>
              </View>
            </Animated.View>

            {/* ── Card (floats between top and bottom) ── */}
            <Animated.View style={[styles.card, { backgroundColor: cardBg }, cardStyle]}>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                returnKeyType="next"
                colors={colors}
                testID="login-email-input"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                colors={colors}
                testID="login-password-input"
                trailingIcon={
                  <IconBtn onPress={() => setShowPass(!showPass)} icon={showPass ? EyeOff : Eye} colors={colors} />
                }
              />

              <Text style={[styles.hint, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>
                Default: admin@local.internal · Admin123!
              </Text>

              <FillBtn
                label="Sign in"
                onPress={handleLogin}
                loading={loading}
                colors={colors}
                testID="login-submit-button"
              />

            </Animated.View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const TOP_H = SH * 0.42; // top colored section takes 42% of screen

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Two fixed bg layers — no jumping
  topBg: { position: 'absolute', top: 0, left: 0, right: 0, height: TOP_H },
  botBg: { position: 'absolute', top: TOP_H, left: 0, right: 0, bottom: 0 },

  // Main layout column
  layout: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Header — sits on colored top bg
  header: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  logoBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImg: { width: 36, height: 36 },
  brand:   { fontSize: 14, letterSpacing: 0.5, marginBottom: 12, opacity: 0.8 },
  headText:{ },
  headline: { fontSize: 34, lineHeight: 42, letterSpacing: -0.5, marginBottom: 4 },
  subhead:  { fontSize: 15, lineHeight: 22 },

  // Card — overlaps the two bg layers
  card: {
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },

  // Input
  inputWrap:  { marginBottom: 18 },
  inputLabel: { fontSize: 13, letterSpacing: 0.2, marginBottom: 7 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
  },
  inputText:  { flex: 1, fontSize: 16, paddingVertical: 0 },
  inputTrail: { marginLeft: 6 },

  hint: { fontSize: 12, textAlign: 'center', marginBottom: 22, letterSpacing: 0.3 },

  fillBtn:     { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fillBtnText: { fontSize: 15, letterSpacing: 0.1 },
});
