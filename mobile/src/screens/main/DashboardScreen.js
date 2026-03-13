// ============================================================
// AssetFlow — DashboardScreen — VIVID M3
// · Big punchy stat cards with colored numbers (like web)
// · Background tinted with accent (primaryContainer)
// · Section cards on surface with accent icon tints
// · Accent color VERY visible throughout
// ============================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Dimensions, Animated, Pressable,
} from 'react-native';
import {
  useSharedValue, useAnimatedReaction, runOnJS, withTiming, Easing,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users, Package, Archive, ArrowLeftRight,
  CreditCard, TrendingUp, Activity, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import { getColors, FONTS } from '../../constants/theme';
import { dashboardApi, transfersApi, subscriptionsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { SkeletonStatCard } from '../../components/SkeletonLoader';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 12) / 2;
const CHART_COLORS = ['#f43f5e','#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

// ─── CountUp ──────────────────────────────────────────────────
const CountUp = ({ target, color, size = 32 }) => {
  const [display, setDisplay] = useState(0);
  const sv = useSharedValue(0);
  useAnimatedReaction(() => sv.value, (v) => runOnJS(setDisplay)(Math.floor(v)));
  useEffect(() => {
    sv.value = 0;
    sv.value = withTiming(target, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [target]);
  return (
    <Text style={{ fontSize: size, fontFamily: FONTS.bold, color, lineHeight: size + 4, letterSpacing: -0.5 }}>
      {display.toLocaleString()}
    </Text>
  );
};

// ─── StatCard — vivid, like web version ───────────────────────
const StatCard = ({ icon: Icon, label, value, tint, colors, onPress, subtitle }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const ty    = useRef(new Animated.Value(28)).current;
  const op    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, speed: 16, bounciness: 0, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
      android_ripple={{ color: tint + '33', borderless: false, radius: 200 }}
    >
      <Animated.View style={[styles.statCard, {
        backgroundColor: colors.surface,
        width: CARD_W,
        borderWidth: 1.5,
        borderColor: tint + '45',
        opacity: op,
        transform: [{ scale }, { translateY: ty }],
      }]}>
        {/* Blob decorations */}
        <View style={[styles.blobOuter, { backgroundColor: tint + '18' }]} />
        <View style={[styles.blobInner, { backgroundColor: tint + '35' }]} />
        {/* Icon */}
        <View style={[styles.statIconWrap, { backgroundColor: tint + '20' }]}>
          <Icon size={18} color={tint} strokeWidth={2.2} />
        </View>
        {/* Big colored number */}
        <CountUp target={value || 0} color={tint} size={30} />
        <Text style={[styles.statLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>{label}</Text>
        {subtitle ? <Text style={[styles.statSub, { color: tint, fontFamily: FONTS.semiBold }]}>{subtitle}</Text> : null}
      </Animated.View>
    </Pressable>
  );
};

// ─── SectionCard ──────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, tint, colors, onViewAll, children, delay = 0 }) => {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, speed: 14, bounciness: 0, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: tint + '45', opacity: op, transform: [{ translateY: ty }] }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.sectionIconWrap, { backgroundColor: tint + '20' }]}>
            <Icon size={15} color={tint} strokeWidth={2.2} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.onSurface, fontFamily: FONTS.semiBold }]}>{title}</Text>
        </View>
        {onViewAll && (
          <Pressable onPress={onViewAll} android_ripple={{ color: tint + '22', borderless: true, radius: 40 }} style={styles.viewAllBtn}>
            <Text style={[styles.viewAllText, { color: tint, fontFamily: FONTS.semiBold }]}>View all</Text>
            <ChevronRight size={13} color={tint} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
      {children}
    </Animated.View>
  );
};

// ─── DonutChart ───────────────────────────────────────────────
const DonutChart = ({ data, colors }) => {
  const [active, setActive] = useState(null);
  const size = 160, r = 56, cx = 80, cy = 80, strokeW = 20;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + (d.count || 0), 0);
  let cum = 0;
  const slices = data.map((d, i) => {
    const pct = total ? (d.count || 0) / total : 0;
    const start = cum; cum += pct;
    return { ...d, pct, start, color: CHART_COLORS[i % CHART_COLORS.length] };
  });
  const activeSlice = active !== null ? slices[active] : null;
  return (
    <View style={styles.donutWrap}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={strokeW} stroke={colors.outlineVariant || colors.border} />
          {slices.map((s, i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color}
              strokeWidth={active === i ? strokeW + 5 : strokeW}
              strokeDasharray={`${s.pct * circ} ${circ}`}
              strokeDashoffset={-s.start * circ}
              opacity={active !== null && active !== i ? 0.2 : 1}
              strokeLinecap="round"
            />
          ))}
        </Svg>
        <View style={styles.donutCenter}>
          {activeSlice ? (
            <>
              <Text style={{ fontSize: 22, fontFamily: FONTS.bold, color: activeSlice.color }}>{activeSlice.count}</Text>
              <Text style={{ fontSize: 10, fontFamily: FONTS.regular, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 64 }}>{activeSlice.name}</Text>
              <Text style={{ fontSize: 11, fontFamily: FONTS.semiBold, color: activeSlice.color }}>{(activeSlice.pct * 100).toFixed(0)}%</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 28, fontFamily: FONTS.bold, color: colors.onSurface }}>{total}</Text>
              <Text style={{ fontSize: 11, fontFamily: FONTS.regular, color: colors.onSurfaceVariant }}>Total</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.donutLegend}>
        {slices.map((s, i) => (
          <Pressable key={i}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActive(active === i ? null : i); }}
            android_ripple={{ color: s.color + '22' }}
            style={[styles.legendItem, { backgroundColor: active === i ? s.color + '18' : 'transparent' }]}
          >
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendName, { color: colors.onSurface, fontFamily: FONTS.regular }]} numberOfLines={1}>{s.name}</Text>
            <View style={styles.legendRight}>
              <View style={[styles.legendBarBg, { backgroundColor: colors.outlineVariant || colors.border }]}>
                <View style={[styles.legendBarFill, { backgroundColor: s.color, width: `${s.pct * 100}%` }]} />
              </View>
              <Text style={[styles.legendCount, { color: colors.onSurface, fontFamily: FONTS.bold }]}>{s.count}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// ─── BarChart ─────────────────────────────────────────────────
const BarChart = ({ data, colors }) => {
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map(d => d.count || 0), 1);
  useEffect(() => {
    Animated.stagger(50, anims.map(a =>
      Animated.spring(a, { toValue: 1, speed: 12, bounciness: 0, useNativeDriver: false })
    )).start();
  }, []);
  return (
    <View style={styles.barChartWrap}>
      {data.map((d, i) => {
        const pct   = (d.count || 0) / max;
        const color = CHART_COLORS[i % CHART_COLORS.length];
        const isActive = active === i;
        const barH = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(pct * 130, 6)] });
        return (
          <Pressable key={i} style={styles.barCol}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActive(isActive ? null : i); }}
            android_ripple={{ color: color + '33', borderless: true }}
          >
            <Text style={[styles.barCount, { color: isActive ? color : colors.onSurface, fontFamily: FONTS.bold }]}>{d.count || 0}</Text>
            <View style={[styles.barTrack, { backgroundColor: color + '1A' }]}>
              <Animated.View style={{
                width: '100%', height: barH, borderRadius: 10, backgroundColor: color,
                opacity: active !== null && !isActive ? 0.2 : 1,
                position: 'absolute', bottom: 0,
              }} />
            </View>
            <Text style={[styles.barLabel, { color: isActive ? color : colors.onSurfaceVariant, fontFamily: FONTS.regular }]} numberOfLines={1}>{d.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── AssignmentRing ───────────────────────────────────────────
const AssignmentRing = ({ assigned, inventory, total, colors }) => {
  const size = 130, r = 48, cx = 65, cy = 65, sw = 18;
  const circ = 2 * Math.PI * r;
  const pct    = total ? assigned / total : 0;
  const invPct = total ? inventory / total : 0;
  const AC = '#10b981', IC = '#f59e0b';
  const rows = [
    { label: 'Assigned',  value: assigned,  pct,    color: AC },
    { label: 'Inventory', value: inventory, pct: invPct, color: IC },
  ];
  return (
    <View style={styles.ringWrap}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke={colors.outlineVariant || colors.border} />
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={IC} strokeWidth={sw}
            strokeDasharray={`${invPct * circ} ${circ}`} strokeLinecap="round" />
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={AC} strokeWidth={sw}
            strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round" />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={{ fontSize: 24, fontFamily: FONTS.bold, color: colors.onSurface }}>{total ? Math.round(pct * 100) : 0}%</Text>
          <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontFamily: FONTS.regular }}>assigned</Text>
        </View>
      </View>
      <View style={styles.ringStats}>
        {rows.map((item, i) => (
          <View key={i} style={styles.ringStatRow}>
            <View style={[styles.ringDot, { backgroundColor: item.color }]} />
            <Text style={[styles.ringStatLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>{item.label}</Text>
            <View style={[styles.ringStatBar, { backgroundColor: colors.outlineVariant || colors.border }]}>
              <View style={[styles.ringStatFill, { backgroundColor: item.color, width: `${item.pct * 100}%` }]} />
            </View>
            <Text style={[styles.ringStatVal, { color: colors.onSurface, fontFamily: FONTS.bold }]}>{item.value}</Text>
          </View>
        ))}
        <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, fontFamily: FONTS.regular, marginTop: 8 }}>{total} total assets</Text>
      </View>
    </View>
  );
};

// ─── TransferRow ──────────────────────────────────────────────
const TransferRow = ({ item, index, colors, tint }) => {
  const tx = useRef(new Animated.Value(-20)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }),
      Animated.spring(tx, { toValue: 0, speed: 18, bounciness: 0, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);
  const assetName = item.assetModelNumber || item.assetTypeName || 'Asset';
  return (
    <Animated.View style={[styles.transferRow, { borderBottomColor: colors.outlineVariant || colors.border, opacity: op, transform: [{ translateX: tx }] }]}>
      <View style={[styles.transferIcon, { backgroundColor: tint + '20' }]}>
        <ArrowLeftRight size={14} color={tint} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.transferName, { color: colors.onSurface, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{assetName} transferred</Text>
        <Text style={[styles.transferSub, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]} numberOfLines={1}>
          {item.fromName || 'Inventory'} → {item.toName || 'Inventory'}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── EmployeeRow ──────────────────────────────────────────────
const EmployeeRow = ({ emp, index, max, colors }) => {
  const barAnim = useRef(new Animated.Value(0)).current;
  const op      = useRef(new Animated.Value(0)).current;
  const pct     = max ? (emp.assetCount || 0) / max : 0;
  const color   = CHART_COLORS[index % CHART_COLORS.length];
  const initials = (emp.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op,      { toValue: 1,   duration: 280, delay: index * 60, useNativeDriver: true }),
      Animated.timing(barAnim, { toValue: pct, duration: 700, delay: index * 60 + 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);
  const barW = barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <Animated.View style={[styles.empRow, { opacity: op }]}>
      <View style={[styles.empAvatar, { backgroundColor: color + '28' }]}>
        <Text style={[styles.empInitials, { color, fontFamily: FONTS.bold }]}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.empRowTop}>
          <Text style={[styles.empName, { color: colors.onSurface, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{emp.name}</Text>
          <Text style={[styles.empCount, { color, fontFamily: FONTS.bold }]}>{emp.assetCount || 0}</Text>
        </View>
        <View style={[styles.empBarBg, { backgroundColor: colors.outlineVariant || colors.border }]}>
          <Animated.View style={[styles.empBarFill, { backgroundColor: color, width: barW }]} />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── SubChip ──────────────────────────────────────────────────
const SubChip = ({ label, value, color, bg, delay }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const op    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op,    { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 14, bounciness: 0, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.subChip, { backgroundColor: bg, opacity: op, transform: [{ scale }], borderWidth: 1, borderColor: color + '40' }]}>
      <Text style={[styles.subChipVal, { color, fontFamily: FONTS.bold }]}>{value}</Text>
      <Text style={[styles.subChipLabel, { color: color + 'BB', fontFamily: FONTS.regular }]}>{label}</Text>
    </Animated.View>
  );
};

// ─── SubsSection ──────────────────────────────────────────────
const SubsSection = ({ subs, tint, colors, onViewAll }) => {
  const activeSubs   = subs.filter(s => !s.renewalDate || new Date(s.renewalDate) > new Date()).length;
  const expiringSubs = subs.filter(s => {
    if (!s.renewalDate) return false;
    const diff = (new Date(s.renewalDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;
  const expiredSubs  = subs.filter(s => s.renewalDate && new Date(s.renewalDate) < new Date()).length;
  return (
    <SectionCard title="Subscriptions" icon={CreditCard} tint={tint} colors={colors} delay={350} onViewAll={onViewAll}>
      <View style={styles.subSummary}>
        <SubChip label="Active"   value={activeSubs}   color="#10b981" bg="#10b98115" delay={350} />
        <SubChip label="Expiring" value={expiringSubs} color="#f59e0b" bg="#f59e0b15" delay={410} />
        <SubChip label="Expired"  value={expiredSubs}  color="#f43f5e" bg="#f43f5e15" delay={470} />
      </View>
      <Text style={[styles.subTotal, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>{subs.length} total tracked</Text>
    </SectionCard>
  );
};

// ─── DashboardScreen ──────────────────────────────────────────
const DashboardScreen = ({ navigation, tabAnim, tabIndex = 0 }) => {
  const theme       = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const showToast   = useAppStore((s) => s.showToast);
  const colors      = getColors(theme, accentColor, isConnected);

  const stackNavigation = useAppStore((s) => s.stackNavigation);
  const setPendingNav   = useAppStore((s) => s.setPendingNav);
  const setTabIndex     = useAppStore((s) => s.setTabIndex);

  const goTo = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stackNavigation) { setTabIndex(1); setTimeout(() => stackNavigation.navigate(screen), 80); }
    else { setPendingNav(screen); setTabIndex(1); }
  };

  const [stats,          setStats]          = useState(null);
  const [transfers,      setTransfers]      = useState([]);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [subs,           setSubs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);

  const cardsParallax = tabAnim
    ? tabAnim.interpolate({
        inputRange:  [(tabIndex - 1) * width, tabIndex * width, (tabIndex + 1) * width],
        outputRange: [width * 0.25, 0, -width * 0.25],
        extrapolate: 'clamp',
      })
    : null;

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        const cached = await getCached(CK.DASHBOARD);
        if (cached) { setStats(cached); setLoading(false); }
      }
      const [statsRes, transfersRes, subsRes] = await Promise.allSettled([
        dashboardApi.stats(), transfersApi.list(), subscriptionsApi.list(),
      ]);
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value.data;
        setStats(s);
        if (s?.employeeAssets?.length) {
          setEmployeeAssets([...s.employeeAssets].sort((a, b) => (b.assetCount || 0) - (a.assetCount || 0)).slice(0, 6));
        }
        await invalidate(CK.DASHBOARD);
      }
      if (transfersRes.status === 'fulfilled') {
        const data = Array.isArray(transfersRes.value.data) ? transfersRes.value.data : transfersRes.value.data?.transfers || [];
        setTransfers(data.slice(0, 5));
      }
      if (subsRes.status === 'fulfilled') {
        const data = Array.isArray(subsRes.value.data) ? subsRes.value.data : subsRes.value.data?.subscriptions || [];
        setSubs(data);
      }
    } catch {
      showToast("Couldn't load dashboard", 'error');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAll(true); };

  if (loading && !stats) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.statsGrid}>
          {[0,1,2,3].map((i) => <SkeletonStatCard key={i} colors={colors} />)}
        </View>
      </SafeAreaView>
    );
  }

  const assignedPct = stats?.totalAssets ? Math.round((stats.assignedAssets / stats.totalAssets) * 100) : 0;
  const maxEmp = Math.max(...employeeAssets.map(e => e.assetCount || 0), 1);

  // ── Background: light tint of accent = primaryContainer
  // This gives the whole screen a warm accent-colored wash
  const bg = colors.primaryContainer || accentColor + '22';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <PageHeader title="Dashboard" colors={colors} tabAnim={tabAnim} tabIndex={tabIndex} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} colors={[accentColor]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stat Cards */}
        <Animated.View style={[styles.statsGrid, cardsParallax ? { transform: [{ translateX: cardsParallax }] } : null]}>
          <StatCard icon={Users}          label="Employees"    value={stats?.totalEmployees}  tint={accentColor}  colors={colors} onPress={() => goTo('EmployeeList')} />
          <StatCard icon={Package}        label="Total Assets" value={stats?.totalAssets}     tint="#f43f5e"       colors={colors} subtitle={`${assignedPct}% assigned`} onPress={() => goTo('AssetList')} />
          <StatCard icon={ArrowLeftRight} label="Assigned"     value={stats?.assignedAssets}  tint="#10b981"       colors={colors} onPress={() => goTo('AssetList')} />
          <StatCard icon={Archive}        label="Inventory"    value={stats?.inventoryAssets} tint="#f59e0b"       colors={colors} onPress={() => goTo('Inventory')} />
        </Animated.View>

        {/* Assignment Ring */}
        {stats ? (
          <SectionCard title="Assignment Status" icon={Activity} tint={accentColor} colors={colors} delay={100}>
            <AssignmentRing assigned={stats.assignedAssets || 0} inventory={stats.inventoryAssets || 0} total={stats.totalAssets || 0} colors={colors} />
          </SectionCard>
        ) : null}

        {/* Donut */}
        {stats?.assetsByType?.length > 0 ? (
          <SectionCard title="Assets by Type" icon={Activity} tint={accentColor} colors={colors} delay={150}>
            <DonutChart data={stats.assetsByType} colors={colors} />
          </SectionCard>
        ) : null}

        {/* Bar Chart */}
        {stats?.assetsByType?.length > 0 ? (
          <SectionCard title="Distribution" icon={TrendingUp} tint={accentColor} colors={colors} delay={200}>
            <BarChart data={stats.assetsByType.slice(0, 7)} colors={colors} />
          </SectionCard>
        ) : null}

        {/* Transfers */}
        <SectionCard title="Recent Transfers" icon={ArrowLeftRight} tint={accentColor} colors={colors} delay={250} onViewAll={() => goTo('Transfer')}>
          {transfers.length > 0
            ? transfers.map((t, i) => <TransferRow key={t.id || t._id || i} item={t} index={i} colors={colors} tint={accentColor} />)
            : <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No transfers yet</Text>}
        </SectionCard>

        {/* Employees */}
        {employeeAssets.length > 0 ? (
          <SectionCard title="Employees by Assets" icon={Users} tint={accentColor} colors={colors} delay={300} onViewAll={() => goTo('EmployeeList')}>
            {employeeAssets.map((emp, i) => <EmployeeRow key={emp.id || emp._id || i} emp={emp} index={i} max={maxEmp} colors={colors} />)}
          </SectionCard>
        ) : null}

        {/* Subscriptions */}
        {subs.length > 0 ? (
          <SubsSection subs={subs} tint={accentColor} colors={colors} onViewAll={() => goTo('SubscriptionList')} />
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:            { flex: 1 },
  topFade:         { position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 0 },
  scrollContent:   { paddingBottom: 20 },

  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 14, marginTop: 8 },
  statCard:        { borderRadius: 20, padding: 18, overflow: 'hidden', height: 155 },
  blobOuter:       { position: 'absolute', right: -28, bottom: -28, width: 90, height: 90, borderRadius: 45 },
  blobInner:       { position: 'absolute', right: -8,  bottom: -8,  width: 44, height: 44, borderRadius: 22 },
  statIconWrap:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statLabel:       { fontSize: 12, marginTop: 3, letterSpacing: 0.2 },
  statSub:         { fontSize: 10, marginTop: 3 },

  sectionCard:       { marginHorizontal: 16, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1 },
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconWrap:   { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:      { fontSize: 15, letterSpacing: 0.1 },
  viewAllBtn:        { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 6, borderRadius: 8 },
  viewAllText:       { fontSize: 12 },

  donutWrap:     { flexDirection: 'column', alignItems: 'center', gap: 16 },
  donutCenter:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  donutLegend:   { width: '100%', gap: 2 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 9, gap: 8, borderRadius: 10 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendName:    { flex: 1, fontSize: 13 },
  legendRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBarBg:   { width: 60, height: 4, borderRadius: 2, overflow: 'hidden' },
  legendBarFill: { height: '100%', borderRadius: 2 },
  legendCount:   { fontSize: 13, width: 24, textAlign: 'right' },

  barChartWrap:  { flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 6, paddingTop: 24 },
  barCol:        { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barCount:      { fontSize: 11, marginBottom: 4 },
  barTrack:      { width: '100%', height: 140, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  barLabel:      { fontSize: 9, marginTop: 6, textAlign: 'center' },

  ringWrap:      { flexDirection: 'row', alignItems: 'center', gap: 20 },
  ringCenter:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringStats:     { flex: 1, gap: 12 },
  ringStatRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ringDot:       { width: 8, height: 8, borderRadius: 4 },
  ringStatLabel: { fontSize: 12, width: 60 },
  ringStatBar:   { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  ringStatFill:  { height: '100%', borderRadius: 3 },
  ringStatVal:   { fontSize: 13, width: 28, textAlign: 'right' },

  transferRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  transferIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transferName:  { fontSize: 13, marginBottom: 2 },
  transferSub:   { fontSize: 11 },

  empRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  empAvatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  empInitials:   { fontSize: 13 },
  empRowTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  empName:       { fontSize: 13, flex: 1 },
  empCount:      { fontSize: 13 },
  empBarBg:      { height: 5, borderRadius: 3, overflow: 'hidden' },
  empBarFill:    { height: '100%', borderRadius: 3 },

  subSummary:    { flexDirection: 'row', gap: 10, marginBottom: 12 },
  subChip:       { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  subChipVal:    { fontSize: 24, lineHeight: 30 },
  subChipLabel:  { fontSize: 11, marginTop: 3 },
  subTotal:      { fontSize: 11 },
  emptyText:     { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
});

export default DashboardScreen;
