import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl, TextInput, ScrollView, Animated,
} from 'react-native';
import { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing as REasing } from 'react-native-reanimated';
import ReAnimated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Plus, Package, ChevronDown, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { assetsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';
import { SkeletonList } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';

const getAssetDisplayName = (asset) => {
  if (!asset.fieldValues || !asset.assetType?.fields) return asset.assetTag || 'Unnamed';
  const listField = asset.assetType.fields.find((f) => f.showInList);
  if (listField && asset.fieldValues[listField.id]) return asset.fieldValues[listField.id];
  const firstValue = Object.values(asset.fieldValues)[0];
  return firstValue || asset.assetTag || 'Unnamed';
};

const AssetRow = ({ item, onPress, colors }) => {
  const displayName = getAssetDisplayName(item);
  const isAssigned = !!item.assignedEmployeeId;
  const employeeName = item.assignedEmployee?.name || null;
  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={[styles.assetRow, { borderBottomColor: colors.border }]}>
        <View style={styles.assetRowContent}>
          <Text style={[styles.assetName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: isAssigned ? '#16a34a22' : '#d9770622' }]}>
          <View style={[styles.statusDot, { backgroundColor: isAssigned ? '#16a34a' : '#d97706' }]} />
          <Text style={[styles.statusText, { color: isAssigned ? '#16a34a' : '#d97706', fontFamily: FONTS.semiBold }]}>
            {isAssigned ? (employeeName || 'Assigned') : 'Unassigned'}
          </Text>
        </View>
        <ChevronRight size={14} color={colors.textSubtle} />
      </View>
    </TouchableOpacity>
  );
};

const AssetGroup = ({ group, onPressAsset, colors, accentColor, isExpanded, onToggle }) => {
  const animation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [isExpanded]);

  const maxHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 9999],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.groupContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.groupIcon, { backgroundColor: colors.accentLight }]}>
          <Package size={18} color={accentColor} />
        </View>
        <Text style={[styles.groupName, { color: colors.text, fontFamily: FONTS.semiBold }]}>
          {(group.typeName || 'Unknown').toUpperCase()}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.countText, { color: accentColor, fontFamily: FONTS.semiBold }]}>
            {group.assets.length}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={18} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, opacity, overflow: 'hidden' }}>
        {group.assets.map((asset) => (
          <AssetRow
            key={asset.id || asset._id}
            item={asset}
            onPress={onPressAsset}
            colors={colors}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const AssetListScreen = ({ navigation }) => {
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState({});

  const groupAssets = (assets) => {
    const map = {};
    assets.forEach((asset) => {
      const typeName = asset.assetType?.name || 'Unknown';
      const typeId = asset.assetType?.id || asset.assetType?._id || typeName;
      if (!map[typeId]) map[typeId] = { typeId, typeName, assets: [] };
      map[typeId].assets.push(asset);
    });
    return Object.values(map).sort((a, b) => b.assets.length - a.assets.length);
  };

  const fetchAssets = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      const cached = await getCached(CK.ASSETS);
      if (cached) {
        const g = groupAssets(cached);
        setGroups(g); setFilteredGroups(g); setLoading(false);
      }
    }
    try {
      const res = { data: isRefresh ? (await assetsApi.list()).data : await getCached(CK.ASSETS) };
      const data = Array.isArray(res.data) ? res.data : res.data?.assets || [];
      const g = groupAssets(data);
      setGroups(g); setFilteredGroups(g);
      await invalidate(CK.ASSETS);
    } catch (e) {
      if (!groups.length) showToast('Failed to load assets', 'error');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFilteredGroups(groups); return; }
    const q = search.toLowerCase();
    const filtered = groups.map((group) => ({
      ...group,
      assets: group.assets.filter((a) => {
        const name = getAssetDisplayName(a).toLowerCase();
        const employee = (a.assignedEmployee?.name || '').toLowerCase();
        const tag = (a.assetTag || '').toLowerCase();
        return name.includes(q) || employee.includes(q) || tag.includes(q);
      }),
    })).filter((g) => g.assets.length > 0);
    setFilteredGroups(filtered);
  }, [search, groups]);

  const toggleGroup = (typeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedKeys((prev) => ({ ...prev, [typeId]: !prev[typeId] }));
  };

  const onRefresh = () => { setRefreshing(true); fetchAssets(true); };
  const isWriteAllowed = user?.role !== ROLES.USER;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>Assets</Text>
        {isWriteAllowed && (
          <TouchableOpacity onPress={() => navigation.navigate('AddAsset')}>
            <Plus size={24} color={accentColor} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textSubtle} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search assets or employees..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !groups.length ? (
        <SkeletonList count={6} colors={colors} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          type="assets"
          title="No assets found"
          message={search ? 'Try a different search term' : 'Add your first asset to get started.'}
          actionLabel={isWriteAllowed && !search ? 'Add Asset' : undefined}
          onAction={isWriteAllowed && !search ? () => navigation.navigate('AddAsset') : undefined}
          colors={colors}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} colors={[accentColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredGroups.map((group) => (
            <AssetGroup
              key={group.typeId}
              group={group}
              onPressAsset={(a) => navigation.navigate('AssetDetail', { asset: a })}
              colors={colors}
              accentColor={accentColor}
              isExpanded={!!expandedKeys[group.typeId]}
              onToggle={() => toggleGroup(group.typeId)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  groupContainer: { borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  groupIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 14, letterSpacing: 0.5 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 12 },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, gap: 10 },
  assetRowContent: { flex: 1 },
  assetName: { fontSize: 14 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
});

export default AssetListScreen;
