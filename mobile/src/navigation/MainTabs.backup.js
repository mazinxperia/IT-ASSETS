import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, BackHandler, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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

const ExitHandler = ({ active }) => {
  useFocusEffect(
    useCallback(() => {
      if (!active || Platform.OS !== 'android') return;
      const onBackPress = () => {
        Alert.alert('Exit AssetFlow?', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [active])
  );
  return null;
};

const Tab0 = ({ tabOffset, children }) => {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tabOffset.value }] }));
  return <Animated.View style={[styles.screen, style]}>{children}</Animated.View>;
};
const Tab1 = ({ tabOffset, children }) => {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tabOffset.value + width }] }));
  return <Animated.View style={[styles.screen, style]}>{children}</Animated.View>;
};
const Tab2 = ({ tabOffset, children }) => {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tabOffset.value + 2 * width }] }));
  return <Animated.View style={[styles.screen, style]}>{children}</Animated.View>;
};
const Tab3 = ({ tabOffset, children }) => {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tabOffset.value + 3 * width }] }));
  return <Animated.View style={[styles.screen, style]}>{children}</Animated.View>;
};

const MainTabs = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const tabOffset = useSharedValue(0);

  const snapTo = (index) => {
    const clamped = Math.max(0, Math.min(TABS.length - 1, index));
    useAppStore.setState({ prevTabIndex: activeIndexRef.current, tabIndex: clamped });
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
    tabOffset.value = withTiming(-clamped * width, { duration: 300, easing: EASING });
  };

  const fakeNavigation = {
    emit: () => ({ defaultPrevented: false }),
    navigate: (name) => {
      const index = TABS.indexOf(name);
      if (index !== -1) snapTo(index);
    },
  };

  const assetsNavRef = useRef(null);

  return (
    <View style={styles.container}>
      <ExitHandler active={activeIndex === 0 || activeIndex === 2 || activeIndex === 3} />

      <View style={styles.screensContainer}>
        <Tab0 tabOffset={tabOffset}>
          <DashboardScreen tabIndex={0} navigation={fakeNavigation} />
        </Tab0>
        <Tab1 tabOffset={tabOffset}>
          <AssetsStack tabIndex={1} onNavigatorReady={(nav) => { assetsNavRef.current = nav; }} />
        </Tab1>
        <Tab2 tabOffset={tabOffset}>
          <UsersScreen tabIndex={2} />
        </Tab2>
        <Tab3 tabOffset={tabOffset}>
          <SettingsScreen tabIndex={3} />
        </Tab3>
      </View>

      <BottomNav state={buildNavState(activeIndex)} navigation={fakeNavigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1 },
  screensContainer: { flex: 1, overflow: 'hidden' },
  screen:           { ...StyleSheet.absoluteFillObject, width },
});

export default MainTabs;
