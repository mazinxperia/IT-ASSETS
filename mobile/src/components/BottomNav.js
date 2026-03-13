import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, PanResponder, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, Users, Settings } from 'lucide-react-native';
import useAppStore from '../store/useAppStore';
import { getColors, FONTS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;

const TABS = [
  { name: 'Dashboard', label: 'Home',     Icon: LayoutDashboard },
  { name: 'Assets',    label: 'Assets',   Icon: Package },
  { name: 'Users',     label: 'Users',    Icon: Users },
  { name: 'Settings',  label: 'Settings', Icon: Settings },
];

const getIconColor = (hex) => {
  try {
    const c = (hex || '').replace('#', '');
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    return lum > 0.5 ? '#111111' : '#ffffff';
  } catch { return '#ffffff'; }
};

const BottomNav = ({ state, navigation, tabAnim, onDrag, onSnap }) => {
  const insets      = useSafeAreaInsets();
  const theme       = useAppStore(s => s.theme);
  const accentColor = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const colors      = getColors(theme, accentColor, isConnected);
  const iconColor   = getIconColor(accentColor);

  const currentIndex   = useRef(state.index);
  currentIndex.current = state.index;

  const pillAnim           = useRef(new Animated.Value(state.index)).current;
  const [containerW, setContainerW] = useState(SCREEN_WIDTH * 0.8);
  const dragStartX         = useRef(0);
  const dragStartIndex     = useRef(0);
  const isDragging           = useRef(false);
  const [snappedIndex, setSnappedIndex] = useState(state.index);

  React.useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: state.index,
      useNativeDriver: false,
      damping: 18, stiffness: 200, mass: 0.4,
    }).start();
    setSnappedIndex(state.index);
  }, [state.index]);

  const tabW = containerW / TAB_COUNT;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 5 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: (e) => {
      isDragging.current     = true;
      dragStartX.current     = e.nativeEvent.pageX;
      dragStartIndex.current = currentIndex.current;
      pillAnim.stopAnimation();
    },
    onPanResponderMove: (e) => {
      const dx      = e.nativeEvent.pageX - dragStartX.current;
      const delta   = dx / tabW;
      const raw     = dragStartIndex.current + delta;
      const clamped = Math.max(0, Math.min(TAB_COUNT - 1, raw));
      pillAnim.setValue(clamped);
      onDrag?.(clamped);
    },
    onPanResponderRelease: (e, g) => {
      const dx      = e.nativeEvent.pageX - dragStartX.current;
      const delta   = dx / tabW;
      const raw     = dragStartIndex.current + delta;
      const nudged  = raw + (g.vx > 0.3 ? 0.5 : g.vx < -0.3 ? -0.5 : 0);
      const snapped = Math.max(0, Math.min(TAB_COUNT - 1, Math.round(nudged)));
      Animated.spring(pillAnim, {
        toValue: snapped,
        useNativeDriver: false,
        damping: 18, stiffness: 200, mass: 0.4,
      }).start();
      isDragging.current = false;
      setSnappedIndex(snapped);
      onSnap?.(snapped);
    },
    onPanResponderTerminate: () => {
      const idx = currentIndex.current;
      Animated.spring(pillAnim, {
        toValue: idx,
        useNativeDriver: false,
        damping: 18, stiffness: 200, mass: 0.4,
      }).start();
      isDragging.current = false;
      setSnappedIndex(idx);
    },
  })).current;

  return (
    <View style={[styles.outer, { bottom: Math.max(insets.bottom, 16) + 8 }]} pointerEvents="box-none">
      <View
        style={[styles.container, { backgroundColor: colors.navBg }]}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Sliding pill */}
        <Animated.View
          pointerEvents="none"
          style={[styles.activeBg, {
            backgroundColor: accentColor,
            width: tabW - 8,
            transform: [{
              translateX: pillAnim.interpolate({
                inputRange:  [0, 1, 2, 3],
                outputRange: [4, tabW + 4, tabW * 2 + 4, tabW * 3 + 4],
              }),
            }],
          }]}
        />

        {TABS.map((tab, index) => {
          const isFocused = snappedIndex === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index]?.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              useAppStore.setState({ prevTabIndex: currentIndex.current, tabIndex: index });
              navigation.navigate(tab.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              <tab.Icon
                size={18}
                color={isFocused ? iconColor : colors.textMuted}
                strokeWidth={isFocused ? 2.2 : 1.8}
              />
              {isFocused && !isDragging.current && (
                <Animated.Text style={[styles.label, { color: iconColor, fontFamily: FONTS.semiBold }]}>
                  {tab.label}
                </Animated.Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    borderRadius: 40,
    paddingHorizontal: 0,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    top: 6, bottom: 6,
    borderRadius: 30,
    zIndex: 0,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    borderRadius: 30,
    gap: 6,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
  },
});

export default BottomNav;
