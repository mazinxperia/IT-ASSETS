import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, X, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '../store/useAppStore';
import { getColors, FONTS } from '../constants/theme';
import { checkHealth } from '../services/api';

const PEACH = 'rgb(245, 235, 226)';
const NAVY = 'rgb(21, 32, 54)';

const ReconnectBubble = () => {
  const insets = useSafeAreaInsets();
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);
  const showConnectionBubble = useAppStore((s) => s.showConnectionBubble);
  const backendUrl = useAppStore((s) => s.backendUrl);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const token = useAppStore((s) => s.token);
  const setIsConnected = useAppStore((s) => s.setIsConnected);
  const setIsConnecting = useAppStore((s) => s.setIsConnecting);
  const setBackendUrl = useAppStore((s) => s.setBackendUrl);
  const showToast = useAppStore((s) => s.showToast);

  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState(backendUrl || '');
  const [connecting, setConnecting] = useState(false);

  // Animations
  const pulse = useSharedValue(1);
  const bubbleOpacity = useSharedValue(0);
  const panelWidth = useSharedValue(44);
  const panelHeight = useSharedValue(44);
  const panelRadius = useSharedValue(22);
  const contentOpacity = useSharedValue(0);
  const iconOpacity = useSharedValue(1);

  useEffect(() => {
    if (!isConnected) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.out(Easing.cubic) }),
          withTiming(1.0, { duration: 700, easing: Easing.out(Easing.cubic) }),
          withTiming(1.0, { duration: 500 })
        ),
        -1
      );
      bubbleOpacity.value = withTiming(1, { duration: 400 });
    } else {
      pulse.value = withTiming(1, { duration: 200 });
      bubbleOpacity.value = withTiming(0, { duration: 500 });
      if (expanded) collapsePanel();
    }
  }, [isConnected]);

  const expandPanel = () => {
    setExpanded(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Stop pulse while expanded
    pulse.value = withTiming(1, { duration: 150 });
    iconOpacity.value = withTiming(0, { duration: 120 });
    panelWidth.value = withSpring(280, { damping: 22, stiffness: 280 });
    panelHeight.value = withSpring(200, { damping: 22, stiffness: 280 });
    panelRadius.value = withSpring(20, { damping: 22, stiffness: 280 });
    contentOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
  };

  const collapsePanel = () => {
    contentOpacity.value = withTiming(0, { duration: 150 });
    panelWidth.value = withSpring(44, { damping: 22, stiffness: 300 });
    panelHeight.value = withSpring(44, { damping: 22, stiffness: 300 });
    panelRadius.value = withSpring(22, { damping: 22, stiffness: 300 });
    iconOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    setTimeout(() => setExpanded(false), 300);
    Keyboard.dismiss();
  };

  const handleConnect = async () => {
    if (!url.trim()) return;
    setConnecting(true);
    Keyboard.dismiss();
    const trimmed = url.trim().replace(/\/$/, '');
    const healthy = await checkHealth(trimmed);
    if (healthy) {
      setBackendUrl(trimmed);
      setIsConnecting(false);
      setIsConnected(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      collapsePanel();
      showToast('Reconnected successfully', 'success');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Cannot reach server. Check URL.', 'error');
    }
    setConnecting(false);
  };

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    width: panelWidth.value,
    height: panelHeight.value,
    borderRadius: panelRadius.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  // Hide on onboarding or when connected or bubble disabled
  if (!onboardingComplete || isConnected || !showConnectionBubble) return null;

  const panelBg = isDark ? '#1a1a24' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : NAVY;
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(21,32,54,0.45)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(21,32,54,0.05)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(21,32,54,0.12)';

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom, 8) + 90 },
        bubbleStyle,
      ]}
      testID="reconnect-bubble"
    >
      <Animated.View
        style={[
          styles.panel,
          { backgroundColor: panelBg },
          panelStyle,
          // Only pulse when collapsed
          !expanded && pulseStyle,
        ]}
      >
        {/* Collapsed state — wifi icon */}
        {!expanded && (
          <TouchableOpacity
            style={styles.bubbleBtn}
            onPress={expandPanel}
            activeOpacity={0.85}
          >
            <Animated.View style={iconStyle}>
              <Wifi size={18} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Expanded state — reconnect form */}
        {expanded && (
          <Animated.View style={[styles.expandedContent, contentStyle]}>
            {/* Header row */}
            <View style={styles.expandedHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.wifiDot}>
                  <Wifi size={12} color="#FFFFFF" />
                </View>
                <Text style={[styles.panelTitle, { color: textColor, fontFamily: FONTS.bold }]}>
                  Reconnect
                </Text>
              </View>
              <TouchableOpacity onPress={collapsePanel} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <X size={16} color={mutedColor} />
              </TouchableOpacity>
            </View>

            {/* URL input */}
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TextInput
                style={[styles.input, { color: textColor, fontFamily: FONTS.regular }]}
                value={url}
                onChangeText={setUrl}
                placeholder="http://192.168.1.x:8001"
                placeholderTextColor={mutedColor}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleConnect}
                testID="reconnect-url-input"
              />
            </View>

            {/* Connect button */}
            <TouchableOpacity
              style={[styles.connectBtn, { backgroundColor: NAVY }]}
              onPress={handleConnect}
              disabled={connecting}
              activeOpacity={0.85}
              testID="reconnect-connect-button"
            >
              {connecting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.btnInner}>
                  <View style={styles.btnIcon}>
                    <ArrowRight size={13} color={NAVY} />
                  </View>
                  <Text style={[styles.connectBtnText, { fontFamily: FONTS.semiBold }]}>
                    Connect
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    zIndex: 999,
  },
  panel: {
    backgroundColor: '#F43F5E',
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  bubbleBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F43F5E',
    borderRadius: 22,
  },
  expandedContent: {
    flex: 1,
    padding: 14,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wifiDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: {
    fontSize: 14,
  },
  inputRow: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  input: {
    fontSize: 13,
    flex: 1,
  },
  connectBtn: {
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
});

export default ReconnectBubble;
