import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable, Animated,
} from 'react-native';
import {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, Easing,
  useAnimatedReaction, runOnJS,
} from 'react-native-reanimated';
import ReanimatedAnimated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Users, Archive, ArrowLeftRight, CreditCard, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import { getColors, FONTS } from '../../constants/theme';
import { ROLES as ROLE_CONSTS } from '../../constants/config';
import { getCached, CK } from '../../services/DataCacheService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

// ─── CountUp ─────────────────────────────────────────────────
const CountUp = ({ target, color, size = 30 }) => {
  const [display, setDisplay] = useState(0);
  const sv = useSharedValue(0);
  useAnimatedReaction(() => sv.value, (v) => runOnJS(setDisplay)(Math.floor(v)));
  useEffect(() => {
    sv.value = 0;
    sv.value = withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [target]);
  return (
    <Text style={{ fontSize: size, fontFamily: FONTS.bold, color, lineHeight: size + 4, letterSpacing: -0.5 }}>
      {display.toLocaleString()}
    </Text>
  );
};

// ─── HubCard ─────────────────────────────────────────────────
const HubCard = ({ card, onPress, colors, accentColor, count }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const ty    = useRef(new Animated.Value(28)).current;
  const op    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, speed: 16, bounciness: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const handlePress = async () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 0 }),
    ]).start();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(card.screen);
  };

  const tint = accentColor;

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: tint + '33', borderless: false, radius: 200 }}
    >
      <Animated.View style={[styles.hubCard, {
        backgroundColor: colors.surface,
        width: CARD_WIDTH,
        borderWidth: 1.5,
        borderColor: tint + '45',
        opacity: op,
        transform: [{ scale }, { translateY: ty }],
      }]}>
        {/* Blobs */}
        <View style={[styles.blobOuter, { backgroundColor: tint + '18' }]} />
        <View style={[styles.blobInner, { backgroundColor: tint + '35' }]} />
        {/* Icon */}
        <View style={[styles.cardIcon, { backgroundColor: tint + '20' }]}>
          <card.Icon size={20} color={tint} strokeWidth={2.2} />
        </View>
        {/* Count or spacer */}
        {card.showCount ? (
          <CountUp target={count ?? 0} color={tint} size={30} />
        ) : (
          <Text style={{ fontSize: 30, color: tint, fontFamily: FONTS.bold, lineHeight: 34 }}>→</Text>
        )}
        <Text style={[styles.cardLabel, { color: colors.text, fontFamily: FONTS.semiBold }]}>{card.label}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── FABOption ───────────────────────────────────────────────
const FABOption = ({ option, index, onPress, accentColor }) => {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value    = withDelay(index * 50, withSpring(1, { damping: 25, stiffness: 350 }));
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 25, stiffness: 350 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <ReanimatedAnimated.View style={[styles.fabOption, style]}>
      <TouchableOpacity
        style={[styles.fabOptionBtn, { backgroundColor: '#FFFFFF' }]}
        onPress={() => onPress(option.screen)}
      >
        <option.Icon size={16} color="#1a1a2e" />
        <Text style={[styles.fabOptionLabel, { color: '#1a1a2e', fontFamily: FONTS.semiBold }]}>{option.label}</Text>
      </TouchableOpacity>
    </ReanimatedAnimated.View>
  );
};

const FAB_OPTIONS = [
  { key: 'subscription', label: 'Add Subscription', Icon: CreditCard, screen: 'AddSubscription' },
  { key: 'employee',     label: 'Add Employee',     Icon: Users,       screen: 'AddEmployee' },
  { key: 'asset',        label: 'Add Asset',         Icon: Package,     screen: 'AddAsset' },
];

// ─── Screen ──────────────────────────────────────────────────
const AssetsHubScreen = ({ navigation, tabAnim, tabIndex = 1, onNavigatorReady }) => {
  const theme       = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const user        = useAppStore((s) => s.user);
  const colors      = getColors(theme, accentColor, isConnected);

  const setStackNavigation = useAppStore((s) => s.setStackNavigation);
  const pendingNav         = useAppStore((s) => s.pendingNav);
  const setPendingNav      = useAppStore((s) => s.setPendingNav);

  const [counts, setCounts] = useState({ assets: 0, employees: 0, inventory: 0 });
  const [fabOpen, setFabOpen] = useState(false);
  const fabRotate      = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    setStackNavigation(navigation);
    if (onNavigatorReady) onNavigatorReady(navigation);
  }, [navigation]);

  useEffect(() => {
    if (pendingNav) {
      const screen = pendingNav;
      setPendingNav(null);
      setTimeout(() => navigation.navigate(screen), 50);
    }
  }, [pendingNav]);

  // Load counts from cache
  useEffect(() => {
    (async () => {
      try {
        const [assets, employees, subs] = await Promise.all([
          getCached(CK.ASSETS),
          getCached(CK.EMPLOYEES),
          getCached(CK.SUBSCRIPTIONS),
        ]);
        const assetList    = Array.isArray(assets) ? assets : [];
        const employeeList = Array.isArray(employees) ? employees : [];
        const subList      = Array.isArray(subs) ? subs : [];
        const inventory    = assetList.filter(a => !a.employeeId && !a.assignedTo);
        setCounts({
          assets:        assetList.length,
          employees:     employeeList.length,
          inventory:     inventory.length,
          subscriptions: subList.length,
        });
      } catch {}
    })();
  }, []);

  const isWriteAllowed = user?.role !== ROLE_CONSTS.USER;

  const cardsParallax = tabAnim
    ? tabAnim.interpolate({
        inputRange: [(tabIndex - 1) * width, tabIndex * width, (tabIndex + 1) * width],
        outputRange: [width * 0.25, 0, -width * 0.25],
        extrapolate: 'clamp',
      })
    : null;

  const toggleFab = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const opening = !fabOpen;
    setFabOpen(opening);
    fabRotate.value      = withTiming(opening ? 1 : 0, { duration: 250, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    backdropOpacity.value = withTiming(opening ? 1 : 0, { duration: 200 });
  };

  const handleFabOption = (screen) => {
    toggleFab();
    setTimeout(() => navigation.navigate(screen), 100);
  };

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotate.value * 45}deg` }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const CARDS = [
    { key: 'assets',      label: 'Assets',        Icon: Package,        screen: 'AssetList',       showCount: true,  countKey: 'assets' },
    { key: 'employees',   label: 'Employees',     Icon: Users,          screen: 'EmployeeList',    showCount: true,  countKey: 'employees' },
    { key: 'inventory',   label: 'Inventory',     Icon: Archive,        screen: 'Inventory',       showCount: true,  countKey: 'inventory' },
    { key: 'transfers',   label: 'Transfers',     Icon: ArrowLeftRight, screen: 'Transfer',        showCount: false },
    { key: 'subscriptions', label: 'Subscriptions', Icon: CreditCard,  screen: 'SubscriptionList', showCount: true, countKey: 'subscriptions' },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      {fabOpen && (
        <ReanimatedAnimated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={toggleFab} />
        </ReanimatedAnimated.View>
      )}

      <PageHeader title="Assets" colors={colors} />

      <Animated.View style={[styles.grid, cardsParallax ? { transform: [{ translateX: cardsParallax }] } : null]}>
        {CARDS.map((card) => (
          <HubCard
            key={card.key}
            card={card}
            onPress={(screen) => navigation.navigate(screen)}
            colors={colors}
            accentColor={accentColor}
            count={card.showCount ? counts[card.countKey] : 0}
          />
        ))}
      </Animated.View>

      {isWriteAllowed && (
        <View style={[styles.fabContainer, { bottom: 100 }]}>
          {fabOpen && FAB_OPTIONS.map((opt, i) => (
            <FABOption key={opt.key} option={opt} index={i} onPress={handleFabOption} accentColor={accentColor} />
          ))}
          <TouchableOpacity style={[styles.fab, { backgroundColor: accentColor }]} onPress={toggleFab}>
            <ReanimatedAnimated.View style={fabStyle}>
              <Plus size={26} color="#FFFFFF" />
            </ReanimatedAnimated.View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  backdrop:     { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  hubCard:      { borderRadius: 20, padding: 18, height: 155, overflow: 'hidden' },
  blobOuter:    { position: 'absolute', right: -28, bottom: -28, width: 90, height: 90, borderRadius: 45 },
  blobInner:    { position: 'absolute', right: -8,  bottom: -8,  width: 44, height: 44, borderRadius: 22 },
  cardIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel:    { fontSize: 14, marginTop: 4 },
  fabContainer: { position: 'absolute', right: 20, alignItems: 'flex-end', zIndex: 20 },
  fab:          { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 12 },
  fabOption:    { marginBottom: 10 },
  fabOptionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  fabOptionLabel: { fontSize: 14 },
});

export default AssetsHubScreen;
