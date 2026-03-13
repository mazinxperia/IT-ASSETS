import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
  TextInput, ScrollView, Animated, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, Package, ChevronDown, Eye, Edit2,
  Trash2, ArrowLeftRight, Boxes, User, Check, X, ChevronLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { assetsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';
import { SkeletonList } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';

// ─── Helpers ──────────────────────────────────────────────────────
const getModelNumber = (asset) => {
  if (!asset.fieldValues || !asset.assetType?.fields) return asset.assetTag || '—';
  const mf = asset.assetType.fields.find(f =>
    f.name?.toLowerCase().includes('model') || f.showInList
  );
  if (mf && asset.fieldValues[mf.id]) return asset.fieldValues[mf.id];
  const first = Object.values(asset.fieldValues)[0];
  return first || asset.assetTag || '—';
};

// ─── Assign Modal ─────────────────────────────────────────────────
const AssignModal = ({ visible, asset, employees, onAssign, onClose, colors, accentColor }) => {
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeaderRow}>
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold }]}>
              Assign to Employee
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.sheetCloseBtn, { backgroundColor: colors.inputBg }]}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.sheetSearch, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Search size={14} color={colors.textSubtle} />
            <TextInput
              style={[{ flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.regular }]}
              placeholder="Search employees..."
              placeholderTextColor={colors.textSubtle}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {filtered.map(emp => {
              const empId = emp.id || emp._id;
              const isSel = selected === empId;
              return (
                <TouchableOpacity
                  key={empId}
                  style={[styles.empRow, { borderBottomColor: colors.border }, isSel && { backgroundColor: `${accentColor}12` }]}
                  onPress={() => setSelected(isSel ? '' : empId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.empAvatar, { backgroundColor: `${accentColor}18` }]}>
                    <Text style={[{ fontSize: 12, color: accentColor, fontFamily: FONTS.bold }]}>
                      {(emp.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
                    <Text style={[{ fontSize: 12, color: colors.textMuted, fontFamily: FONTS.regular }]}>{emp.employeeId}</Text>
                  </View>
                  {isSel && <Check size={16} color={accentColor} />}
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={[{ color: colors.textMuted, fontFamily: FONTS.regular, fontSize: 14 }]}>No employees found</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.assignBtn, { backgroundColor: selected ? accentColor : colors.inputBg, margin: 16 }]}
            onPress={() => selected && onAssign(asset, selected)}
            disabled={!selected}
            activeOpacity={0.85}
          >
            <ArrowLeftRight size={15} color={selected ? '#fff' : colors.textMuted} />
            <Text style={[{ fontSize: 15, fontFamily: FONTS.semiBold, color: selected ? '#fff' : colors.textMuted, marginLeft: 6 }]}>
              Assign to Employee
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Asset Row ────────────────────────────────────────────────────
const InventoryRow = ({ item, onView, onEdit, onDelete, onAssign, colors, accentColor, isWriteAllowed }) => {
  const modelNumber = getModelNumber(item);
  const typeName = item.assetType?.name || '—';

  return (
    <TouchableOpacity
      onPress={() => onView(item)}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      {/* Left: model + type badge */}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.rowModel, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
          {modelNumber}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: `${accentColor}14` }]}>
          <Text style={[styles.typeBadgeText, { color: accentColor, fontFamily: FONTS.semiBold }]}>
            {typeName.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Right: actions */}
      <View style={styles.rowActions}>
        {isWriteAllowed && (
          <TouchableOpacity
            style={[styles.assignPill, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}30` }]}
            onPress={() => onAssign(item)}
            activeOpacity={0.8}
          >
            <ArrowLeftRight size={11} color={accentColor} />
            <Text style={[styles.assignPillText, { color: accentColor, fontFamily: FONTS.semiBold }]}>Assign</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
          onPress={() => onView(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Eye size={13} color={colors.textMuted} />
        </TouchableOpacity>
        {isWriteAllowed && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Edit2 size={13} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
              onPress={() => onDelete(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Trash2 size={13} color="#ef4444" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Collapsible Group ────────────────────────────────────────────
const InventoryGroup = ({ group, colors, accentColor, isExpanded, onToggle, onView, onEdit, onDelete, onAssign, isWriteAllowed }) => {
  const animation = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [isExpanded]);

  const maxHeight = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] });
  const opacity = animation.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });
  const rotate = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Group header */}
      <TouchableOpacity style={styles.groupHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.groupIcon, { backgroundColor: `${accentColor}18` }]}>
          <Package size={16} color={accentColor} />
        </View>
        <Text style={[styles.groupName, { color: colors.text, fontFamily: FONTS.semiBold }]}>
          {(group.typeName || 'Unknown').toUpperCase()}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: `${accentColor}14` }]}>
          <Text style={[styles.countText, { color: accentColor, fontFamily: FONTS.semiBold }]}>
            {group.assets.length} asset{group.assets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Column headers */}
      {isExpanded && (
        <View style={[styles.colHeaders, { borderBottomColor: colors.border, borderTopColor: colors.border }]}>
          <Text style={[styles.colHeader, { color: colors.textSubtle, fontFamily: FONTS.semiBold, flex: 1 }]}>MODEL NUMBER</Text>
          <Text style={[styles.colHeader, { color: colors.textSubtle, fontFamily: FONTS.semiBold }]}>ACTIONS</Text>
        </View>
      )}

      {/* Rows */}
      <Animated.View style={{ maxHeight, opacity, overflow: 'hidden' }}>
        {group.assets.map(asset => (
          <InventoryRow
            key={asset.id || asset._id}
            item={asset}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onAssign={onAssign}
            colors={colors}
            accentColor={accentColor}
            isWriteAllowed={isWriteAllowed}
          />
        ))}
      </Animated.View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────
const InventoryScreen = ({ navigation, tabAnim, tabIndex }) => {
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState({});
  const [assignModal, setAssignModal] = useState({ visible: false, asset: null });
  const [totalCount, setTotalCount] = useState(0);

  const isWriteAllowed = user?.role !== ROLES.USER;

  const groupAssets = (assets) => {
    const map = {};
    assets.forEach(asset => {
      const typeName = asset.assetType?.name || 'Unknown';
      const typeId = asset.assetType?.id || asset.assetType?._id || typeName;
      if (!map[typeId]) map[typeId] = { typeId, typeName, assets: [] };
      map[typeId].assets.push(asset);
    });
    return Object.values(map).sort((a, b) => b.assets.length - a.assets.length);
  };

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      const [allAssets, emps] = await Promise.all([
        getCached(CK.ASSETS),
        getCached(CK.EMPLOYEES),
      ]);
      const assets = Array.isArray(allAssets) ? allAssets : [];
      const unassigned = assets.filter(a => !a.assignedEmployeeId);
      const g = groupAssets(unassigned);
      setGroups(g);
      setFilteredGroups(g);
      setTotalCount(unassigned.length);
      setEmployees(Array.isArray(emps) ? emps : []);

      // Auto-expand first group
      if (g.length > 0 && Object.keys(expandedKeys).length === 0) {
        setExpandedKeys({ [g[0].typeId]: true });
      }
    } catch (e) {
      showToast('Failed to load inventory', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFilteredGroups(groups); return; }
    const q = search.toLowerCase();
    const filtered = groups.map(group => ({
      ...group,
      assets: group.assets.filter(a => {
        const model = getModelNumber(a).toLowerCase();
        const tag = (a.assetTag || '').toLowerCase();
        const type = (a.assetType?.name || '').toLowerCase();
        return model.includes(q) || tag.includes(q) || type.includes(q);
      }),
    })).filter(g => g.assets.length > 0);
    setFilteredGroups(filtered);
  }, [search, groups]);

  const toggleGroup = (typeId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedKeys(prev => ({ ...prev, [typeId]: !prev[typeId] }));
  };

  const handleView = (asset) => navigation.navigate('AssetDetail', { asset });
  const handleEdit = (asset) => navigation.navigate('AddAsset', { editItem: asset });

  const handleDelete = (asset) => {
    Alert.alert('Delete Asset', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await assetsApi.delete(asset.id || asset._id);
            await invalidate(CK.ASSETS, CK.DASHBOARD);
            showToast('Asset deleted', 'success');
            fetchData();
          } catch {
            showToast('Failed to delete asset', 'error');
          }
        },
      },
    ]);
  };

  const handleAssign = async (asset, employeeId) => {
    try {
      await assetsApi.update(asset.id || asset._id, { assignedEmployeeId: employeeId });
      await invalidate(CK.ASSETS, CK.EMPLOYEES, CK.DASHBOARD);
      showToast('Asset assigned', 'success');
      setAssignModal({ visible: false, asset: null });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } catch {
      showToast('Failed to assign asset', 'error');
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 4 }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={28} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            {totalCount} unassigned asset{totalCount !== 1 ? 's' : ''} available
          </Text>
        </View>
        {isWriteAllowed && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: accentColor }]}
            onPress={() => navigation.navigate('AddAsset')}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textSubtle} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: FONTS.regular }]}
          placeholder="Search inventory..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={14} color={colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && !groups.length ? (
        <SkeletonList count={5} colors={colors} />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          type="inventory"
          title={search ? 'No results found' : 'Inventory is empty'}
          message={search ? 'Try a different search term' : 'All assets are currently assigned.'}
          actionLabel={isWriteAllowed && !search ? 'Add Asset' : undefined}
          onAction={isWriteAllowed && !search ? () => navigation.navigate('AddAsset') : undefined}
          colors={colors}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 8, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} colors={[accentColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredGroups.map(group => (
            <InventoryGroup
              key={group.typeId}
              group={group}
              colors={colors}
              accentColor={accentColor}
              isExpanded={!!expandedKeys[group.typeId]}
              onToggle={() => toggleGroup(group.typeId)}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAssign={(asset) => setAssignModal({ visible: true, asset })}
              isWriteAllowed={isWriteAllowed}
            />
          ))}
        </ScrollView>
      )}

      {/* Assign Modal */}
      <AssignModal
        visible={assignModal.visible}
        asset={assignModal.asset}
        employees={employees}
        onAssign={handleAssign}
        onClose={() => setAssignModal({ visible: false, asset: null })}
        colors={colors}
        accentColor={accentColor}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },

  groupCard: { borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  groupIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 13, letterSpacing: 0.5 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 11 },

  colHeaders: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  colHeader: { fontSize: 10, letterSpacing: 1 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  rowModel: { fontSize: 14 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, letterSpacing: 0.3 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assignPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  assignPillText: { fontSize: 11 },
  actionBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Assign modal
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingBottom: 34 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle: { fontSize: 17 },
  sheetCloseBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetSearch: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, height: 38, gap: 8, marginBottom: 8 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  empAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  assignBtn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

export default InventoryScreen;
