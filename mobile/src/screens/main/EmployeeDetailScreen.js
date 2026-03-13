import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Image, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Edit2, Trash2, Package, User,
  Plus, Check, X, ChevronRight, Calendar,
  Hash, Layers,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { employeesApi, assetsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';

const { width, height } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = (name) =>
  (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const getAssetDisplayName = (asset) => {
  if (!asset) return 'Asset';
  const fv = asset.fieldValues || {};
  const fields = asset.assetType?.fields || [];
  const mf = fields.find(f => f.name === 'Model Number');
  if (mf && fv[mf.id]) return fv[mf.id];
  const listField = fields.find(f => f.showInList);
  if (listField && fv[listField.id]) return fv[listField.id];
  const firstVal = Object.values(fv)[0];
  if (firstVal) return String(firstVal);
  return asset.assetTag || 'Asset';
};

// ─── Animated Fade In ─────────────────────────────────────────────
const FadeIn = ({ delay = 0, children, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 20, bounciness: 4, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

// ─── Hero Card ─────────────────────────────────────────────────────
const HeroCard = ({ employee, assignedCount, accentColor, colors }) => (
  <FadeIn delay={60}>
    <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={[`${accentColor}28`, `${accentColor}00`]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={styles.heroRow}>
        {/* Big Avatar */}
        <View style={[styles.heroAvatar, { backgroundColor: `${accentColor}22`, borderColor: `${accentColor}40` }]}>
          <Text style={[styles.heroAvatarText, { color: accentColor, fontFamily: FONTS.bold }]}>
            {getInitials(employee.name)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroName, { color: colors.text, fontFamily: FONTS.bold }]}>{employee.name}</Text>
          <View style={[styles.idChip, { backgroundColor: colors.inputBg }]}>
            <Hash size={11} color={colors.textMuted} />
            <Text style={[styles.idChipText, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>
              {employee.employeeId}
            </Text>
          </View>
        </View>
        {/* Asset count badge */}
        <View style={[styles.assetCountBadge, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}>
          <Text style={[styles.assetCountNum, { color: accentColor, fontFamily: FONTS.bold }]}>{assignedCount}</Text>
          <Text style={[styles.assetCountLabel, { color: accentColor, fontFamily: FONTS.regular }]}>assets</Text>
        </View>
      </View>

      {/* Created / Updated */}
      <View style={[styles.heroDates, { borderTopColor: colors.border }]}>
        <View style={styles.heroDateItem}>
          <Calendar size={11} color={colors.textSubtle} />
          <Text style={[styles.heroDateText, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
            Created {formatDate(employee.createdAt)}
          </Text>
        </View>
        {employee.updatedAt && (
          <View style={styles.heroDateItem}>
            <Calendar size={11} color={colors.textSubtle} />
            <Text style={[styles.heroDateText, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
              Updated {formatDate(employee.updatedAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
  </FadeIn>
);

// ─── Summary Card ──────────────────────────────────────────────────
const SummaryCard = ({ assignedAssets, accentColor, colors }) => {
  // Count by type
  const byType = assignedAssets.reduce((acc, a) => {
    const t = a.assetType?.name || 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const typeEntries = Object.entries(byType);

  return (
    <FadeIn delay={120}>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
            <Layers size={14} color={accentColor} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>Summary</Text>
        </View>

        {/* Total */}
        <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Total Assets</Text>
          <View style={[styles.summaryBadge, { backgroundColor: `${accentColor}18` }]}>
            <Text style={[styles.summaryBadgeText, { color: accentColor, fontFamily: FONTS.bold }]}>{assignedAssets.length}</Text>
          </View>
        </View>

        {/* By type */}
        {typeEntries.length > 0 ? (
          <>
            <Text style={[styles.summaryTypeLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>By Type</Text>
            {typeEntries.map(([type, count], i) => (
              <View
                key={type}
                style={[styles.summaryTypeRow, i < typeEntries.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <Text style={[styles.summaryTypeName, { color: colors.text, fontFamily: FONTS.regular }]}>{type}</Text>
                <View style={[styles.summaryBadge, { backgroundColor: colors.inputBg }]}>
                  <Text style={[styles.summaryBadgeText, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>{count}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <Text style={[styles.summaryEmpty, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>No assets yet</Text>
        )}
      </View>
    </FadeIn>
  );
};

// ─── Assigned Asset Row ────────────────────────────────────────────
const AssetRow = ({ asset, onPress, onUnassign, accentColor, colors, index, isReadOnly }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay: index * 40, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, speed: 22, bounciness: 4, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayName = getAssetDisplayName(asset);
  const typeName = asset.assetType?.name || 'N/A';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View style={[styles.assetRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.assetRowLeft} onPress={onPress} activeOpacity={0.8}>
          {asset.imageUrl ? (
            <Image source={{ uri: asset.imageUrl }} style={styles.assetThumb} />
          ) : (
            <View style={[styles.assetThumbPlaceholder, { backgroundColor: `${accentColor}18` }]}>
              <Package size={18} color={accentColor} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.assetName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.assetType, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{typeName}</Text>
          </View>
          <ChevronRight size={15} color={colors.textSubtle} style={{ marginRight: 8 }} />
        </TouchableOpacity>
        {!isReadOnly && (
          <TouchableOpacity
            onPress={onUnassign}
            style={[styles.unassignBtn, { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.08)' }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.unassignText, { fontFamily: FONTS.semiBold }]}>Unassign</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

// ─── Assign Modal ──────────────────────────────────────────────────
const AssignModal = ({ visible, employeeName, availableAssets, selectedAssets, onToggle, onConfirm, onClose, assigning, accentColor, colors }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.assignModalBackdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      <View style={[styles.assignSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Handle */}
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold }]}>
              Assign Assets
            </Text>
            <Text style={[styles.sheetSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              {selectedAssets.length} selected · to {employeeName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.sheetCloseBtn, { backgroundColor: colors.inputBg }]}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ maxHeight: height * 0.45 }} showsVerticalScrollIndicator={false}>
          {availableAssets.length === 0 ? (
            <View style={styles.assignEmpty}>
              <Package size={28} color={colors.textSubtle} />
              <Text style={[styles.assignEmptyTitle, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>
                No assets in inventory
              </Text>
              <Text style={[styles.assignEmptySub, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
                Add assets to inventory first
              </Text>
            </View>
          ) : (
            availableAssets.map((asset) => {
              const isSelected = selectedAssets.includes(asset.id || asset._id);
              const displayName = getAssetDisplayName(asset);
              return (
                <TouchableOpacity
                  key={asset.id || asset._id}
                  onPress={() => onToggle(asset.id || asset._id)}
                  activeOpacity={0.8}
                  style={[
                    styles.assignAssetRow,
                    {
                      borderColor: isSelected ? accentColor : colors.border,
                      backgroundColor: isSelected ? `${accentColor}0e` : 'transparent',
                    },
                  ]}
                >
                  {/* Checkbox */}
                  <View style={[styles.checkbox, { borderColor: isSelected ? accentColor : colors.border, backgroundColor: isSelected ? accentColor : 'transparent' }]}>
                    {isSelected && <Check size={12} color="#fff" />}
                  </View>
                  {/* Image */}
                  {asset.imageUrl ? (
                    <Image source={{ uri: asset.imageUrl }} style={styles.assignThumb} />
                  ) : (
                    <View style={[styles.assignThumbPlaceholder, { backgroundColor: colors.inputBg }]}>
                      <Package size={16} color={colors.textSubtle} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.assignAssetName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[styles.assignAssetType, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                      {asset.assetType?.name || 'N/A'} · {asset.assetTag}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.sheetFooter}>
          <TouchableOpacity
            style={[styles.sheetCancelBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            onPress={onClose} activeOpacity={0.8}
          >
            <Text style={[styles.sheetBtnText, { color: colors.text, fontFamily: FONTS.semiBold }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetConfirmBtn, { backgroundColor: selectedAssets.length > 0 ? accentColor : colors.border, opacity: selectedAssets.length === 0 || assigning ? 0.5 : 1 }]}
            onPress={onConfirm}
            disabled={selectedAssets.length === 0 || assigning}
            activeOpacity={0.8}
          >
            {assigning ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={15} color="#fff" />
                <Text style={[styles.sheetBtnText, { color: '#fff', fontFamily: FONTS.semiBold }]}>
                  Assign{selectedAssets.length > 0 ? ` (${selectedAssets.length})` : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Confirm Modal ─────────────────────────────────────────────────
const ConfirmModal = ({ visible, title, message, confirmLabel, onConfirm, onCancel, colors }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.modalBackdrop}>
      <View style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.confirmTitle, { color: colors.text, fontFamily: FONTS.bold }]}>{title}</Text>
        <Text style={[styles.confirmMsg, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{message}</Text>
        <View style={styles.confirmBtns}>
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.inputBg, borderColor: colors.border, borderWidth: 1 }]} onPress={onCancel} activeOpacity={0.8}>
            <Text style={[styles.confirmBtnText, { color: colors.text, fontFamily: FONTS.semiBold }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#ef4444' }]} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={[styles.confirmBtnText, { color: '#fff', fontFamily: FONTS.semiBold }]}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ───────────────────────────────────────────────────
const EmployeeDetailScreen = ({ navigation, route }) => {
  const { employee: routeEmployee, employeeId } = route.params || {};
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const showToast = useAppStore((s) => s.showToast);
  const user = useAppStore((s) => s.user);
  const colors = getColors(theme, accentColor, isConnected);
  const isReadOnly = user?.role === ROLES.USER;

  const [employee, setEmployee] = useState(routeEmployee || null);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const id = employeeId || routeEmployee?._id || routeEmployee?.id;

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Employee fetch + assets from cache in parallel
      const [emp, allAssets] = await Promise.all([
        employeesApi.get(id).then(r => r.data),
        forceRefresh
          ? assetsApi.list().then(r => Array.isArray(r.data) ? r.data : r.data?.assets || [])
          : getCached(CK.ASSETS).then(d => Array.isArray(d) ? d : d?.assets || []),
      ]);
      setEmployee(emp);
      const empId = emp.id || emp._id || id;
      const assigned = allAssets.filter(a =>
        a.assignedEmployeeId === empId || a.assignedEmployeeId === id ||
        a.assignedEmployee?.id === empId || a.assignedEmployee?._id === empId
      );
      const available = allAssets.filter(a => !a.assignedEmployeeId && !a.assignedEmployee);
      setAssignedAssets(assigned);
      setAvailableAssets(available);
    } catch (e) {
      showToast('Failed to load employee', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setDeleting(true);
    try {
      await employeesApi.delete(id);
      await invalidate(CK.EMPLOYEES, CK.DASHBOARD);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Employee deleted', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(i => i !== assetId) : [...prev, assetId]
    );
  };

  const handleAssignAssets = async () => {
    if (selectedAssets.length === 0) return;
    setAssigning(true);
    try {
      await Promise.all(
        selectedAssets.map(assetId => assetsApi.update(assetId, { assignedEmployeeId: id }))
      );
      showToast(`${selectedAssets.length} asset(s) assigned`, 'success');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAssignDialogOpen(false);
      setSelectedAssets([]);
      fetchData();
    } catch {
      showToast('Failed to assign assets', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (assetId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await assetsApi.update(assetId, { assignedEmployeeId: null });
      showToast('Asset unassigned', 'success');
      fetchData();
    } catch {
      showToast('Failed to unassign asset', 'error');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!employee) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <FadeIn delay={0}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.bold }]} numberOfLines={1}>
            {employee.name}
          </Text>
          {!isReadOnly && (
            <View style={styles.headerBtns}>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('EditEmployee', { employee })}
                activeOpacity={0.8}
              >
                <Edit2 size={15} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setDeleteDialogOpen(true); }}
                activeOpacity={0.8}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator size="small" color="#ef4444" />
                  : <Trash2 size={15} color="#ef4444" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </FadeIn>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <HeroCard employee={employee} assignedCount={assignedAssets.length} accentColor={accentColor} colors={colors} />

        {/* Summary */}
        <SummaryCard assignedAssets={assignedAssets} accentColor={accentColor} colors={colors} />

        {/* Assigned Assets */}
        <FadeIn delay={180}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
                <Package size={14} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>Assigned Assets</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                  {assignedAssets.length} asset{assignedAssets.length !== 1 ? 's' : ''} assigned
                </Text>
              </View>
              {!isReadOnly && (
                <TouchableOpacity
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAssignDialogOpen(true); }}
                  style={[styles.assignBtn, { backgroundColor: accentColor }]}
                  activeOpacity={0.85}
                >
                  <Plus size={14} color="#fff" />
                  <Text style={[styles.assignBtnText, { fontFamily: FONTS.semiBold }]}>Assign</Text>
                </TouchableOpacity>
              )}
            </View>

            {assignedAssets.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.inputBg }]}>
                <Package size={24} color={colors.textSubtle} />
                <Text style={[styles.emptyTitle, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>No assets assigned</Text>
                <Text style={[styles.emptySub, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>Tap Assign to add assets</Text>
              </View>
            ) : (
              assignedAssets.map((asset, i) => (
                <AssetRow
                  key={asset.id || asset._id || i}
                  asset={asset}
                  index={i}
                  isReadOnly={isReadOnly}
                  accentColor={accentColor}
                  colors={colors}
                  onPress={() => navigation.navigate('AssetDetail', { asset, assetId: asset.id || asset._id })}
                  onUnassign={() => handleUnassign(asset.id || asset._id)}
                />
              ))
            )}
          </View>
        </FadeIn>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modals ── */}
      <AssignModal
        visible={assignDialogOpen}
        employeeName={employee.name}
        availableAssets={availableAssets}
        selectedAssets={selectedAssets}
        onToggle={handleAssetToggle}
        onConfirm={handleAssignAssets}
        onClose={() => { setAssignDialogOpen(false); setSelectedAssets([]); }}
        assigning={assigning}
        accentColor={accentColor}
        colors={colors}
      />

      <ConfirmModal
        visible={deleteDialogOpen}
        title="Delete Employee"
        message={`Delete "${employee.name}"? Transfer history will be preserved as text snapshots. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        colors={colors}
      />
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, gap: 12, paddingBottom: 100 },

  // Hero
  heroCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  heroAvatarText: { fontSize: 22 },
  heroName: { fontSize: 20, marginBottom: 6 },
  idChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  idChipText: { fontSize: 12 },
  assetCountBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  assetCountNum: { fontSize: 22, lineHeight: 26 },
  assetCountLabel: { fontSize: 10 },
  heroDates: { flexDirection: 'row', gap: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  heroDateItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroDateText: { fontSize: 11 },

  // Section cards
  sectionCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14 },
  sectionSub: { fontSize: 11, marginTop: 1 },

  // Summary
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryLabel: { fontSize: 13 },
  summaryBadge: { minWidth: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  summaryBadgeText: { fontSize: 13 },
  summaryTypeLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  summaryTypeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  summaryTypeName: { fontSize: 13 },
  summaryEmpty: { textAlign: 'center', fontSize: 12, paddingVertical: 14, paddingHorizontal: 16 },

  // Assign button
  assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  assignBtnText: { color: '#fff', fontSize: 13 },

  // Asset rows
  assetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 0,
  },
  assetRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetThumb: { width: 44, height: 44, borderRadius: 10 },
  assetThumbPlaceholder: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assetName: { fontSize: 14, marginBottom: 2 },
  assetType: { fontSize: 12 },
  unassignBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  unassignText: { color: '#ef4444', fontSize: 12 },

  // Empty state
  emptyBox: { alignItems: 'center', gap: 6, margin: 12, padding: 28, borderRadius: 13 },
  emptyTitle: { fontSize: 14 },
  emptySub: { fontSize: 12 },

  // Assign modal
  assignModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  assignSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    paddingBottom: 34, maxHeight: height * 0.8,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  sheetTitle: { fontSize: 17 },
  sheetSub: { fontSize: 13, marginTop: 2 },
  sheetCloseBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  assignAssetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  assignThumb: { width: 40, height: 40, borderRadius: 8 },
  assignThumbPlaceholder: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  assignAssetName: { fontSize: 14, marginBottom: 2 },
  assignAssetType: { fontSize: 11 },
  assignEmpty: { alignItems: 'center', gap: 8, padding: 40 },
  assignEmptyTitle: { fontSize: 15 },
  assignEmptySub: { fontSize: 13 },

  sheetFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 16 },
  sheetCancelBtn: { flex: 1, height: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetConfirmBtn: { flex: 1, height: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  sheetBtnText: { fontSize: 15 },

  // Confirm modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmBox: { width: '100%', borderRadius: 20, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  confirmTitle: { fontSize: 17, marginBottom: 10 },
  confirmMsg: { fontSize: 14, lineHeight: 21 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  confirmBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 15 },
});

export default EmployeeDetailScreen;
