import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, BackHandler, Alert, Platform, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BottomNav from '../components/BottomNav';
import DashboardScreen from '../screens/main/DashboardScreen';
import UsersScreen from '../screens/main/UsersScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AssetsStack from './AssetsStack';
import useAppStore from '../store/useAppStore';

const { width } = Dimensions.get('window');
const TABS = ['Dashboard', 'Assets', 'Users', 'Settings'];
const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);

const buildNavState = (index) => ({
  index,
  routes: TABS.map((name) => ({ key: name, name })),
});

const ExitHandler = ({ active, activeIndexRef, snapTo, assetsNavRef, tabHistory, tabAnim, setActiveIndex }) => {
  useFocusEffect(
    useCallback(() => {
      if (!active || Platform.OS !== 'android') return;
      const onBackPress = () => {
        // If assets stack has screens to go back to, let it handle it
        const assetsNav = assetsNavRef?.current;
        if (assetsNav && assetsNav.canGoBack && assetsNav.canGoBack()) {
          assetsNav.goBack();
          return true;
        }
        // Pop tab history
        if (tabHistory.current.length > 1) {
          tabHistory.current.pop();
          const prev = tabHistory.current[tabHistory.current.length - 1];
          activeIndexRef.current = prev;
          setActiveIndex(prev);
          Animated.spring(tabAnim, { toValue: prev, useNativeDriver: true, damping: 20, stiffness: 300, mass: 0.6 }).start();
          return true;
        }
        // On first tab — exit directly
        BackHandler.exitApp();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [active])
  );
  return null;
};

const MainTabs = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const tabHistory = useRef([0]); // stack of visited tab indices
  // Single Animated.Value drives everything — screens + nav pill
  const tabAnim = useRef(new Animated.Value(0)).current; // 0 to 3

  const snapTo = (index, animated = true) => {
    const clamped = Math.max(0, Math.min(TABS.length - 1, index));
    if (activeIndexRef.current !== clamped) {
      tabHistory.current.push(activeIndexRef.current);
    }
    useAppStore.setState({ prevTabIndex: activeIndexRef.current, tabIndex: clamped });
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    if (animated) {
      Animated.spring(tabAnim, {
        toValue: clamped,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
        mass: 0.6,
      }).start();
    } else {
      tabAnim.setValue(clamped);
    }
  };

  const fakeNavigation = {
    emit: () => ({ defaultPrevented: false }),
    navigate: (name) => {
      const index = TABS.indexOf(name);
      if (index !== -1) snapTo(index);
    },
  };

  const assetsNavRef = useRef(null);

  // Each screen translates: screenIndex*width - tabAnim*width
  const makeScreenStyle = (index) => ({
    transform: [{
      translateX: tabAnim.interpolate({
        inputRange: [0, 1, 2, 3],
        outputRange: [
          index * width,
          (index - 1) * width,
          (index - 2) * width,
          (index - 3) * width,
        ],
      }),
    }],
  });

  return (
    <View style={styles.container}>
      <ExitHandler active={true} activeIndexRef={activeIndexRef} snapTo={snapTo} assetsNavRef={assetsNavRef} tabHistory={tabHistory} tabAnim={tabAnim} setActiveIndex={setActiveIndex} />

      <View style={styles.screensContainer}>
        <Animated.View style={[styles.screen, makeScreenStyle(0)]}>
          <DashboardScreen tabIndex={0} navigation={fakeNavigation} />
        </Animated.View>
        <Animated.View style={[styles.screen, makeScreenStyle(1)]}>
          <AssetsStack tabIndex={1} onNavigatorReady={(nav) => { assetsNavRef.current = nav; }} />
        </Animated.View>
        <Animated.View style={[styles.screen, makeScreenStyle(2)]}>
          <UsersScreen tabIndex={2} />
        </Animated.View>
        <Animated.View style={[styles.screen, makeScreenStyle(3)]}>
          <SettingsScreen tabIndex={3} />
        </Animated.View>
      </View>

      <BottomNav
        state={buildNavState(activeIndex)}
        navigation={fakeNavigation}
        tabAnim={tabAnim}
        onDrag={(val) => tabAnim.setValue(val)}
        onSnap={snapTo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  screensContainer: { flex: 1, overflow: 'hidden' },
  screen:           { ...StyleSheet.absoluteFillObject, width, margin: 0, padding: 0 },
});

export default MainTabs;
