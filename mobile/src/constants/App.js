// ============================================================
// AssetFlow — App.js
// Dynamic M3 theme: accent color + dark/light both animate
// smoothly using a cross-fade overlay technique
// ============================================================

import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, StatusBar, Platform, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import * as NavigationBar from 'expo-navigation-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';

import RootNavigator from './src/navigation/RootNavigator';
import BootSplashScreen from './src/screens/BootSplashScreen';
import ReconnectBubble from './src/components/ReconnectBubble';
import Toast from './src/components/Toast';
import useAppStore, { themeTransitionRef } from './src/store/useAppStore';
import { useConnection } from './src/hooks/useConnection';
import { buildM3Theme } from './src/constants/theme';

// ─── Animated theme transition duration ──────────────────────
// How long the cross-fade between old and new theme takes
const THEME_TRANSITION_MS = 320;

// ─── AppInner ─────────────────────────────────────────────────
const AppInner = () => {
  const theme      = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);

  useConnection();

  // ── Build the active Paper theme ──────────────────────────
  // Recomputed whenever accent, theme mode, or connection changes
  const paperTheme = useMemo(() => {
    return buildM3Theme(accentColor, theme === 'dark');
  }, [accentColor, theme, isConnected]);

  // ── Smooth theme transition overlay ──────────────────────
  // When accent or mode changes, we briefly flash a same-colored
  // overlay at low opacity so the color shift feels like a
  // gentle cross-dissolve rather than a hard cut
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayColor   = useRef(new Animated.Value(0)).current;
  const [overlayBg, setOverlayBg] = useState(paperTheme.colors.background);
  const prevThemeRef = useRef({ accentColor, theme, isConnected });

  useEffect(() => {
    const prev = prevThemeRef.current;
    const changed =
      prev.accentColor !== accentColor ||
      prev.theme       !== theme       ||
      prev.isConnected !== isConnected;

    if (!changed) return;
    prevThemeRef.current = { accentColor, theme, isConnected };

    // Snapshot the new background color for the overlay
    setOverlayBg(paperTheme.colors.background);

    // Cross-fade: fade in overlay → theme updates (via useMemo above)
    // → fade out overlay
    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: THEME_TRANSITION_MS / 2,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: THEME_TRANSITION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [accentColor, theme, isConnected]);



  // ── Register theme toggle handler for the store ───────────
  useEffect(() => {
    themeTransitionRef.onToggle = (_nextTheme, applyTheme) => {
      // The overlay handles the visual transition
      // Just apply immediately — useMemo + overlay cross-fade does the rest
      applyTheme();
    };
    return () => { themeTransitionRef.onToggle = null; };
  }, []);

  // ── Android system bars ───────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(paperTheme.colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(
        paperTheme.colors.isDark ? 'light' : 'dark'
      ).catch(() => {});
    }
  }, [paperTheme.colors.background, paperTheme.colors.isDark]);

  // ── Boot splash ───────────────────────────────────────────
  const [showBootSplash, setShowBootSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowBootSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  if (showBootSplash) {
    return (
      <View style={[styles.flex, { backgroundColor: '#0a0a0f' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={false} />
        <BootSplashScreen />
      </View>
    );
  }

  return (
    // PaperProvider receives the dynamically-built theme
    // Every Paper component (Button, Card, Appbar, TextInput…)
    // automatically uses the new colors
    <PaperProvider theme={paperTheme}>
      <Reanimated.View
        style={[
          styles.container,
          { backgroundColor: paperTheme.colors.background }
        ]}
      >
        <StatusBar
          barStyle={paperTheme.colors.isDark ? 'light-content' : 'dark-content'}
          backgroundColor={paperTheme.colors.background}
          translucent={false}
        />

        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>

        <ReconnectBubble />
        <Toast />

        {/* Smooth theme transition overlay */}
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: overlayBg, opacity: overlayOpacity },
          ]}
          pointerEvents="none"
        />
      </Reanimated.View>
    </PaperProvider>
  );
};

// ─── Root App ─────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#0a0a0f').catch(() => {});
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
    }
  }, []);

  if (!fontsLoaded) {
    return <View style={[styles.flex, { backgroundColor: '#0a0a0f' }]} />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
