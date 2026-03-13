import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform, Animated, Easing } from 'react-native';
import ReanimatedAnimated from 'react-native-reanimated';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

import RootNavigator from './src/navigation/RootNavigator';
import BootSplashScreen from './src/screens/BootSplashScreen';
import ReconnectBubble from './src/components/ReconnectBubble';
import Toast from './src/components/Toast';
import useAppStore from './src/store/useAppStore';
import { useConnection } from './src/hooks/useConnection';
import { getColors } from './src/constants/theme';

const PEACH = 'rgb(245, 235, 226)';
const DARK = '#0a0a0f';

const AppInner = () => {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);
  const colors = getColors(theme, accentColor, isConnected);

  const [showBootSplash, setShowBootSplash] = useState(true);
  const prevThemeRef = useRef(theme);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState(DARK);

  useConnection();


  useEffect(() => {
    if (prevThemeRef.current === theme) return;
    prevThemeRef.current = theme;

    setFlashColor(theme === 'dark' ? DARK : PEACH);

    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 380,
        delay: 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [theme]);


  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(colors.isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [colors.background, colors.isDark]);

  useEffect(() => {
    const timer = setTimeout(() => setShowBootSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (showBootSplash) {
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" translucent={false} />
        <BootSplashScreen />
      </View>
    );
  }

  return (
    <ReanimatedAnimated.View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <ReconnectBubble />
      <Toast />

      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flashAnim }]}
        pointerEvents="none"
      />
    </ReanimatedAnimated.View>
  );
};

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
    return <View style={styles.splash} />;
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
  flex: { flex: 1 },
  container: { flex: 1 },
  splash: { flex: 1, backgroundColor: '#0a0a0f' },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
