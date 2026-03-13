import 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform, Animated, Easing } from 'react-native';
import Reanimated from 'react-native-reanimated';
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
import OfflineToast from './src/components/OfflineToast';
import ReconnectBubble from './src/components/ReconnectBubble';
import Toast from './src/components/Toast';
import useAppStore, { themeTransitionRef } from './src/store/useAppStore';
import { primeApiCache } from './src/services/api';
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
  const bgAnim    = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;
  const flashColorRef = useRef(DARK);
  const [flashColor, setFlashColor] = useState(DARK);

  useConnection();

  // Register transition handler — called by store's toggleTheme
  useEffect(() => {
    themeTransitionRef.onToggle = (nextTheme, applyTheme) => {
      applyTheme();
      Animated.timing(bgAnim, {
        toValue: nextTheme === 'dark' ? 1 : 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    };

    return () => { themeTransitionRef.onToggle = null; };
  }, []);

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
    <Animated.View style={[styles.container, { backgroundColor: bgAnim.interpolate({ inputRange: [0, 1], outputRange: [PEACH, DARK] }) }]} collapsable={false}>
      <StatusBar
        barStyle={colors.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <ReconnectBubble />
        <OfflineToast />
      <Toast />


    </Animated.View>
  );
};

export default function App() {
  const _storeState = useAppStore.getState();
  React.useEffect(() => {
    primeApiCache(_storeState.backendUrl, _storeState.token);
  }, []);

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

  const [fontTimeout, setFontTimeout] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontTimeout) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <PaperProvider>
          <AppInner />
        </PaperProvider>
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
