import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl, TextInput,
  ScrollView, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Search, Plus, ChevronRight,
  LayoutGrid, List, ChevronDown, Package,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { employeesApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';
import { SkeletonList } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;
const PREF_KEY = '@af_employee_list_prefs';

const SORT_FIELDS = ['Name', 'Employee ID', 'Assets'];
const SORT_DIRS = ['Ascending', 'Descending'];

const getInitials = (name) =>
  (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const getAssetCount = (emp) =>
  emp._count?.assets ?? emp.assignedAssets?.length ?? emp.asset_count ?? 0;

// ── GPU-accelerated press scale wrapper ───────────────────────
const PressScale = ({ onPress, style, children, scale: scaleTo = 0.95 }) => {
  const anim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => Animated.spring(anim, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }).start()}
      activeOpacity={1}
    >
      <Animated.View style={[style, { transform: [{ scale: anim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── List Row ───────────────────────────────────────────────────
const ListRow = ({ item, onPress, colors, accentColor, index }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, delay: index * 25, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 20, bounciness: 4, delay: index * 25, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = getInitials(item.name);
  const assetCount = getAssetCount(item);
  const empId = item.employeeId || item.employee_id || item.emp_id || '';

  return (
    <PressScale onPress={() => onPress(item)} style={[styles.listRow, { backgroundColor: colors.card }]}>
      <Animated.View style={[styles.listRowInner, { opacity, transform: [{ translateY }] }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.avatarText, { color: accentColor, fontFamily: FONTS.bold }]}>{initials}</Text>
        </View>
        <View style={styles.listRowContent}>
          <Text style={[styles.listName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
            {item.name || 'Unnamed'}
          </Text>
          {empId ? (
            <Text style={[styles.listSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              ID: {empId}
            </Text>
          ) : (
            <Text style={[styles.listSub, { color: colors.textMuted, fontFamily: FONTS.regular }]} numberOfLines={1}>
              {item.department || item.email || '—'}
            </Text>
          )}
        </View>
        <View style={[styles.assetBadge, { backgroundColor: colors.accentLight }]}>
          <Package size={11} color={accentColor} />
          <Text style={[styles.assetBadgeText, { color: accentColor, fontFamily: FONTS.semiBold }]}>
            {assetCount}
          </Text>
        </View>
        <ChevronRight size={15} color={colors.textSubtle} style={{ marginLeft: 4 }} />
      </Animated.View>
    </PressScale>
  );
};

// ── Grid Card ──────────────────────────────────────────────────
const GridCard = ({ item, onPress, colors, accentColor, index }) => {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 240, delay: index * 30, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 6, delay: index * 30, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = getInitials(item.name);
  const assetCount = getAssetCount(item);
  const empId = item.employeeId || item.employee_id || item.emp_id || '';

  return (
    <PressScale onPress={() => onPress(item)} style={[styles.gridCard, { backgroundColor: colors.card, width: CARD_W }]}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <View style={[styles.gridAvatar, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.gridAvatarText, { color: accentColor, fontFamily: FONTS.bold }]}>{initials}</Text>
        </View>
        <Text style={[styles.gridName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
          {item.name || 'Unnamed'}
        </Text>
        {empId ? (
          <Text style={[styles.gridId, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            ID: {empId}
          </Text>
        ) : (
          <Text style={[styles.gridId, { color: colors.textMuted, fontFamily: FONTS.regular }]} numberOfLines={1}>
            {item.department || '—'}
          </Text>
        )}
        <View style={styles.gridFooter}>
          <View style={[styles.assetBadge, { backgroundColor: colors.accentLight }]}>
            <Package size={11} color={accentColor} />
            <Text style={[styles.assetBadgeText, { color: accentColor, fontFamily: FONTS.semiBold }]}>
              {assetCount} asset{assetCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    </PressScale>
  );
};

// ── Sort Dropdown ──────────────────────────────────────────────
const SortDropdown = ({ label, options, selected, onSelect, colors, accentColor }) => {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !open;
    setOpen(next);
    Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
  };

  const select = (val) => {
    onSelect(val);
    setOpen(false);
    Animated.spring(anim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const dropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const dropTranslate = anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] });

  return (
    <View style={{ position: 'relative', zIndex: 10 }}>
      <TouchableOpacity
        onPress={toggle}
        style={[styles.sortBtn, { backgroundColor: open ? accentColor : colors.card, borderColor: open ? accentColor : colors.border }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.sortBtnText, { color: open ? '#fff' : colors.text, fontFamily: FONTS.semiBold }]}>
          {selected}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={13} color={open ? '#fff' : colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {open && (
        <Animated.View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border, opacity: dropOpacity, transform: [{ translateY: dropTranslate }] }]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => select(opt)}
              style={[styles.dropdownItem, { backgroundColor: selected === opt ? colors.accentLight : 'transparent' }]}
            >
              <Text style={[styles.dropdownText, { color: selected === opt ? accentColor : colors.text, fontFamily: selected === opt ? FONTS.semiBold : FONTS.regular }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────
const EmployeeListScreen = ({ navigation }) => {
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isGrid, setIsGrid] = useState(false);
  const [sortField, setSortField] = useState('Name');
  const [sortDir, setSortDir] = useState('Ascending');

  // Load saved prefs
  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then((raw) => {
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.isGrid !== undefined) setIsGrid(prefs.isGrid);
        if (prefs.sortField) setSortField(prefs.sortField);
        if (prefs.sortDir) setSortDir(prefs.sortDir);
      }
    }).catch(() => {});
  }, []);

  // Save prefs whenever they change
  useEffect(() => {
    AsyncStorage.setItem(PREF_KEY, JSON.stringify({ isGrid, sortField, sortDir })).catch(() => {});
  }, [isGrid, sortField, sortDir]);

  const sortEmployees = (data, field, dir) => {
    const sorted = [...data].sort((a, b) => {
      let valA, valB;
      if (field === 'Name') { valA = (a.name || '').toLowerCase(); valB = (b.name || '').toLowerCase(); }
      else if (field === 'Employee ID') { valA = a.employeeId || a.employee_id || ''; valB = b.employeeId || b.employee_id || ''; }
      else if (field === 'Assets') { valA = getAssetCount(a); valB = getAssetCount(b); }
      if (valA < valB) return dir === 'Ascending' ? -1 : 1;
      if (valA > valB) return dir === 'Ascending' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const fetchEmployees = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      const cached = await getCached(CK.EMPLOYEES);
      if (cached) {
        setEmployees(cached);
        setFiltered(sortEmployees(cached, sortField, sortDir));
        setLoading(false);
      }
    }
    try {
      const res = { data: isRefresh ? (await employeesApi.list()).data : await getCached(CK.EMPLOYEES) };
      console.log("EMPLOYEES RAW:", JSON.stringify(res.data).slice(0, 400));
      const data = Array.isArray(res.data) ? res.data : res.data?.employees || [];
      setEmployees(data);
      setFiltered(sortEmployees(data, sortField, sortDir));
      await invalidate(CK.EMPLOYEES);
    } catch (e) {
      if (!employees.length) showToast('Failed to load employees', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortField, sortDir]);

  useEffect(() => { fetchEmployees(); }, []);

  // Re-sort + filter when sort/search changes
  useEffect(() => {
    let data = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((e) =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.employeeId || e.employee_id || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q)
      );
    }
    setFiltered(sortEmployees(data, sortField, sortDir));
  }, [search, employees, sortField, sortDir]);

  const toggleView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGrid((prev) => !prev);
  };

  const onRefresh = () => { setRefreshing(true); fetchEmployees(true); };
  const isWriteAllowed = user?.role !== ROLES.USER;

  const renderGrid = () => {
    const rows = [];
    for (let i = 0; i < filtered.length; i += 2) {
      rows.push(
        <View key={i} style={styles.gridRow}>
          <GridCard
            item={filtered[i]}
            onPress={(e) => navigation.navigate('EmployeeDetail', { employee: e })}
            colors={colors}
            accentColor={accentColor}
            index={i}
          />
          {filtered[i + 1] && (
            <GridCard
              item={filtered[i + 1]}
              onPress={(e) => navigation.navigate('EmployeeDetail', { employee: e })}
              colors={colors}
              accentColor={accentColor}
              index={i + 1}
            />
          )}
        </View>
      );
    }
    return rows;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>Employees</Text>
        <View style={styles.headerRight}>
          {isWriteAllowed && (
            <TouchableOpacity onPress={() => navigation.navigate('AddEmployee')} style={styles.headerBtn}>
              <Plus size={22} color={accentColor} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleView} style={styles.headerBtn}>
            {isGrid
              ? <List size={22} color={colors.text} />
              : <LayoutGrid size={22} color={colors.text} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textSubtle} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search name, ID, department..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <SortDropdown
          label="Sort by"
          options={SORT_FIELDS}
          selected={sortField}
          onSelect={setSortField}
          colors={colors}
          accentColor={accentColor}
        />
        <SortDropdown
          label="Order"
          options={SORT_DIRS}
          selected={sortDir}
          onSelect={setSortDir}
          colors={colors}
          accentColor={accentColor}
        />
        <View style={[styles.countChip, { backgroundColor: colors.card }]}>
          <Text style={[styles.countChipText, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            {filtered.length} total
          </Text>
        </View>
      </View>

      {loading && !employees.length ? (
        <SkeletonList count={6} colors={colors} />
      ) : filtered.length === 0 ? (
        <EmptyState
          type="employees"
          title="No employees found"
          message={search ? 'Try a different search term' : 'Add your first employee to get started.'}
          actionLabel={isWriteAllowed && !search ? 'Add Employee' : undefined}
          onAction={isWriteAllowed && !search ? () => navigation.navigate('AddEmployee') : undefined}
          colors={colors}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} colors={[accentColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {isGrid ? renderGrid() : filtered.map((item, index) => (
            <ListRow
              key={item._id || item.id || String(index)}
              item={item}
              index={index}
              onPress={(e) => navigation.navigate('EmployeeDetail', { employee: e })}
              colors={colors}
              accentColor={accentColor}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { padding: 4 },
  title: { fontSize: 20 },

  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, marginBottom: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },

  sortBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, gap: 5 },
  sortBtnText: { fontSize: 12 },
  dropdown: { position: 'absolute', top: 38, left: 0, minWidth: 150, borderRadius: 12, borderWidth: 1, zIndex: 999, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11 },
  dropdownText: { fontSize: 13 },
  countChip: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  countChipText: { fontSize: 12 },

  // List
  listRow: { borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  listRowInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14 },
  listRowContent: { flex: 1 },
  listName: { fontSize: 15, marginBottom: 2 },
  listSub: { fontSize: 12 },

  // Grid
  gridRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  gridCard: { borderRadius: 16, padding: 16 },
  gridAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridAvatarText: { fontSize: 16 },
  gridName: { fontSize: 14, marginBottom: 3 },
  gridId: { fontSize: 11, marginBottom: 10 },
  gridFooter: { flexDirection: 'row' },

  // Shared
  assetBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  assetBadgeText: { fontSize: 11 },
});

export default EmployeeListScreen;
