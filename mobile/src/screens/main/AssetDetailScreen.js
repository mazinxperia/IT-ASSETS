import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Image, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Edit2, Trash2, Package, History,
  User, ImageIcon, X, FileText, ChevronRight,
  Clock, Tag, Calendar, Layers, CheckCircle, Archive,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { assetsApi, transfersApi } from '../../services/api';
import { invalidate, CK } from '../../services/DataCacheService';
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

const getModelNumber = (asset) => {
  const fv = asset?.fieldValues || {};
  const fields = asset?.assetType?.fields || [];
  const mf = fields.find(f => f.name === 'Model Number');
  return mf ? (fv[mf.id] || '') : '';
};

const getAssetDisplayName = (asset) => {
  if (!asset) return 'Asset';
  const model = getModelNumber(asset);
  if (model) return model;
  if (asset.fieldValues) {
    const fields = asset.assetType?.fields || [];
    const listField = fields.find(f => f.showInList);
    if (listField && asset.fieldValues[listField.id]) return asset.fieldValues[listField.id];
    const firstVal = Object.values(asset.fieldValues)[0];
    if (firstVal) return String(firstVal);
  }
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
const HeroCard = ({ asset, accentColor, colors }) => {
  const isAssigned = !!asset.assignedEmployeeId || !!asset.assignedEmployee;
  const displayName = getAssetDisplayName(asset);
  const typeName = asset.assetType?.name || 'Asset';
  const statusColor = isAssigned ? colors.statusActive : colors.warning;
  const statusBg = isAssigned ? colors.successLight : colors.warningLight;
  const StatusIcon = isAssigned ? CheckCircle : Archive;

  return (
    <FadeIn delay={60}>
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <LinearGradient
          colors={[`${accentColor}28`, `${accentColor}00`]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}>
            <Package size={28} color={accentColor} />
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
            <StatusIcon size={12} color={statusColor} />
            <Text style={[styles.statusPillText, { color: statusColor, fontFamily: FONTS.semiBold }]}>
              {isAssigned ? 'Assigned' : 'In Inventory'}
            </Text>
          </View>
        </View>
        <Text style={[styles.heroName, { color: colors.text, fontFamily: FONTS.bold }]}>{displayName}</Text>
        <View style={styles.heroMeta}>
          <View style={[styles.heroChip, { backgroundColor: colors.inputBg }]}>
            <Tag size={11} color={colors.textMuted} />
            <Text style={[styles.heroChipText, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>{asset.assetTag}</Text>
          </View>
          <View style={[styles.heroChip, { backgroundColor: `${accentColor}14` }]}>
            <Layers size={11} color={accentColor} />
            <Text style={[styles.heroChipText, { color: accentColor, fontFamily: FONTS.semiBold }]}>{typeName}</Text>
          </View>
          <View style={[styles.heroChip, { backgroundColor: colors.inputBg }]}>
            <Calendar size={11} color={colors.textMuted} />
            <Text style={[styles.heroChipText, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{formatDate(asset.createdAt)}</Text>
          </View>
        </View>
      </View>
    </FadeIn>
  );
};

// ─── Info Grid Card ────────────────────────────────────────────────
const InfoGridCard = ({ title, icon: Icon, fields, accentColor, colors, delay = 0 }) => (
  <FadeIn delay={delay}>
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
          <Icon size={14} color={accentColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>{title}</Text>
      </View>
      <View style={styles.infoGrid}>
        {fields.map((f, i) => (
          <View
            key={i}
            style={[
              styles.infoCell,
              { borderTopColor: colors.border },
              i % 2 === 0 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
            ]}
          >
            <Text style={[styles.infoCellLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>{f.label}</Text>
            <Text style={[styles.infoCellValue, { color: f.accent ? accentColor : colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={2}>
              {f.value || '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  </FadeIn>
);

// ─── Image Button Card ─────────────────────────────────────────────
const ImageCard = ({ hasImage, onPress, accentColor, colors }) => (
  <FadeIn delay={200}>
    <TouchableOpacity
      onPress={onPress}
      disabled={!hasImage}
      activeOpacity={0.8}
      style={[
        styles.imageCard,
        hasImage
          ? { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' }
          : { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.imageCardIcon, { backgroundColor: hasImage ? 'rgba(34,197,94,0.15)' : colors.inputBg }]}>
        <ImageIcon size={20} color={hasImage ? '#22c55e' : colors.textSubtle} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.imageCardTitle, { color: hasImage ? '#22c55e' : colors.textMuted, fontFamily: FONTS.semiBold }]}>
          {hasImage ? 'View Asset Image' : 'No Image Uploaded'}
        </Text>
        <Text style={[styles.imageCardSub, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
          {hasImage ? 'Tap to view full image' : 'No photo attached'}
        </Text>
      </View>
      {hasImage && <ChevronRight size={18} color="#22c55e" />}
    </TouchableOpacity>
  </FadeIn>
);

// ─── Assigned Employee Card ────────────────────────────────────────
const AssignedCard = ({ asset, accentColor, colors, onPress }) => {
  const emp = asset.assignedEmployee;
  return (
    <FadeIn delay={240}>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
            <User size={14} color={accentColor} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>Assigned To</Text>
        </View>
        {emp ? (
          <TouchableOpacity
            style={[styles.empRow, { backgroundColor: colors.inputBg }]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={[styles.empAvatar, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[styles.empAvatarText, { color: accentColor, fontFamily: FONTS.bold }]}>{getInitials(emp.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.empName, { color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
              <Text style={[styles.empId, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                ID: {emp.employeeId || emp.employee_id || '—'}
              </Text>
            </View>
            <View style={[styles.empArrow, { backgroundColor: `${accentColor}18` }]}>
              <ChevronRight size={15} color={accentColor} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.unassignedBox, { backgroundColor: colors.inputBg }]}>
            <Package size={22} color={colors.textSubtle} />
            <Text style={[styles.unassignedTitle, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>Not Assigned</Text>
            <Text style={[styles.unassignedSub, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>This asset is in inventory</Text>
          </View>
        )}
      </View>
    </FadeIn>
  );
};

// ─── Transfer History Card ─────────────────────────────────────────
const TransferCard = ({ transfers, accentColor, colors, onDeleteTransfer, onNotePress, delay = 0 }) => (
  <FadeIn delay={delay}>
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
          <History size={14} color={accentColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>Transfer History</Text>
        <View style={[styles.countBadge, { backgroundColor: `${accentColor}18` }]}>
          <Text style={[styles.countBadgeText, { color: accentColor, fontFamily: FONTS.semiBold }]}>{transfers.length}</Text>
        </View>
      </View>

      {transfers.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.inputBg }]}>
          <Clock size={20} color={colors.textSubtle} />
          <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: FONTS.regular }]}>No transfer history</Text>
        </View>
      ) : (
        transfers.map((t, i) => (
          <View
            key={t.id || t._id || i}
            style={[styles.transferItem, i < transfers.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <View style={[styles.transferDateWrap, { backgroundColor: colors.inputBg }]}>
              <Clock size={10} color={colors.textSubtle} />
              <Text style={[styles.transferDate, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
                {t.formattedDate || formatDate(t.date)}
              </Text>
            </View>
            <View style={styles.transferFlow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.transferLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>From</Text>
                <Text style={[styles.transferName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{t.fromName || '—'}</Text>
              </View>
              <View style={[styles.transferArrow, { backgroundColor: `${accentColor}18` }]}>
                <ChevronRight size={14} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.transferLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>To</Text>
                <Text style={[styles.transferName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{t.toName || '—'}</Text>
              </View>
            </View>
            <View style={styles.transferActions}>
              {t.notes ? (
                <TouchableOpacity
                  onPress={() => onNotePress(t.notes)}
                  style={[styles.noteBtn, { backgroundColor: `${accentColor}14`, borderColor: `${accentColor}25` }]}
                >
                  <FileText size={11} color={accentColor} />
                  <Text style={[styles.noteBtnText, { color: accentColor, fontFamily: FONTS.semiBold }]}>Note</Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDeleteTransfer(t.id || t._id); }}
                style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}
              >
                <Trash2 size={12} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  </FadeIn>
);

// ─── Modals ────────────────────────────────────────────────────────
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

const NoteModal = ({ note, onClose, colors }) => (
  <Modal visible={!!note} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <View style={[styles.confirmBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FileText size={15} color={colors.textMuted} />
            <Text style={[styles.confirmTitle, { color: colors.text, fontFamily: FONTS.semiBold, marginBottom: 0 }]}>Transfer Note</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.confirmMsg, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{note}</Text>
      </View>
    </View>
  </Modal>
);

const ImageModal = ({ visible, imageUrl, assetTag, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.imgBackdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      <View style={styles.imgBox}>
        <TouchableOpacity style={styles.imgCloseBtn} onPress={onClose}>
          <X size={16} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: imageUrl }} style={styles.imgFull} resizeMode="contain" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imgFooter}>
          <Text style={styles.imgTag}>{assetTag}</Text>
        </LinearGradient>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ───────────────────────────────────────────────────
const AssetDetailScreen = ({ navigation, route }) => {
  const { asset: routeAsset, assetId } = route.params || {};
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const showToast = useAppStore((s) => s.showToast);
  const user = useAppStore((s) => s.user);
  const colors = getColors(theme, accentColor, isConnected);
  const isReadOnly = user?.role === ROLES.USER;

  const [asset, setAsset] = useState(routeAsset || null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTransferId, setDeleteTransferId] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [notePopup, setNotePopup] = useState(null);

  const id = assetId || routeAsset?._id || routeAsset?.id;

  const fetchData = useCallback(async () => {
    try {
      const [assetRes, transfersRes] = await Promise.all([
        assetsApi.get(id),
        transfersApi.assetTransfers(id).catch(() => ({ data: [] })),
      ]);
      setAsset(assetRes.data);
      const tData = Array.isArray(transfersRes.data)
        ? transfersRes.data
        : transfersRes.data?.transfers || [];
      setTransfers(tData);
    } catch (e) {
      showToast('Failed to load asset', 'error');
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
      await assetsApi.delete(id);
      await invalidate(CK.ASSETS, CK.DASHBOARD);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Asset deleted', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to delete asset', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTransfer = async () => {
    const tid = deleteTransferId;
    setDeleteTransferId(null);
    try {
      await transfersApi.delete(tid);
      setTransfers(prev => prev.filter(t => (t.id || t._id) !== tid));
      showToast('Transfer deleted', 'success');
    } catch {
      showToast('Failed to delete transfer', 'error');
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

  if (!asset) return null;

  const fieldValues = asset.fieldValues || {};
  const typeFields = asset.assetType?.fields || [];
  const hasImage = !!asset.imageUrl;
  const displayName = getAssetDisplayName(asset);

  const dynamicFields = typeFields.map(f => ({
    label: f.name,
    value: fieldValues[f.id] !== undefined && fieldValues[f.id] !== '' ? String(fieldValues[f.id]) : '—',
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
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
            {displayName}
          </Text>
          {!isReadOnly && (
            <View style={styles.headerBtns}>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AddAsset', { editItem: asset })}
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
        <HeroCard asset={asset} accentColor={accentColor} colors={colors} />

        <InfoGridCard
          title="Asset Details"
          icon={Tag}
          accentColor={accentColor}
          colors={colors}
          delay={120}
          fields={[
            { label: 'Asset Tag', value: asset.assetTag },
            { label: 'Type', value: asset.assetType?.name || 'N/A', accent: true },
            { label: 'Created', value: formatDate(asset.createdAt) },
            { label: 'Status', value: (!!asset.assignedEmployeeId || !!asset.assignedEmployee) ? 'Assigned' : 'In Inventory' },
          ]}
        />

        {typeFields.length > 0 && (
          <InfoGridCard
            title={`${asset.assetType?.name || 'Type'} Fields`}
            icon={Layers}
            accentColor={accentColor}
            colors={colors}
            delay={160}
            fields={dynamicFields}
          />
        )}

        <ImageCard hasImage={hasImage} onPress={() => setImageModalOpen(true)} accentColor={accentColor} colors={colors} />

        <AssignedCard
          asset={asset}
          accentColor={accentColor}
          colors={colors}
          onPress={() => asset.assignedEmployee && navigation.navigate('EmployeeDetail', { employee: asset.assignedEmployee })}
        />

        <TransferCard
          transfers={transfers}
          accentColor={accentColor}
          colors={colors}
          onDeleteTransfer={setDeleteTransferId}
          onNotePress={setNotePopup}
          delay={280}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      <ImageModal visible={imageModalOpen} imageUrl={asset.imageUrl} assetTag={asset.assetTag} onClose={() => setImageModalOpen(false)} />
      <NoteModal note={notePopup} onClose={() => setNotePopup(null)} colors={colors} />
      <ConfirmModal
        visible={deleteDialogOpen}
        title="Delete Asset"
        message={`Delete "${displayName}" (${asset.assetTag})? This removes all transfer history too. Cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        colors={colors}
      />
      <ConfirmModal
        visible={!!deleteTransferId}
        title="Delete Transfer"
        message="Delete this transfer record? Cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteTransfer}
        onCancel={() => setDeleteTransferId(null)}
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
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroIcon: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusPillText: { fontSize: 12 },
  heroName: { fontSize: 22, lineHeight: 28, marginBottom: 14 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  heroChipText: { fontSize: 11 },

  // Section cards
  sectionCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, flex: 1 },
  countBadge: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontSize: 11 },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoCell: { width: '50%', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  infoCellLabel: { fontSize: 11, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCellValue: { fontSize: 14, lineHeight: 19 },

  // Image card
  imageCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  imageCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  imageCardTitle: { fontSize: 14, marginBottom: 2 },
  imageCardSub: { fontSize: 12 },

  // Employee
  empRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 12, padding: 12, borderRadius: 13, gap: 12 },
  empAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  empAvatarText: { fontSize: 15 },
  empName: { fontSize: 15, marginBottom: 2 },
  empId: { fontSize: 12 },
  empArrow: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  unassignedBox: { alignItems: 'center', gap: 6, marginHorizontal: 12, marginBottom: 12, padding: 24, borderRadius: 13 },
  unassignedTitle: { fontSize: 14 },
  unassignedSub: { fontSize: 12 },

  // Transfers
  transferItem: { paddingHorizontal: 16, paddingVertical: 14 },
  transferDateWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  transferDate: { fontSize: 11 },
  transferFlow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  transferLabel: { fontSize: 10, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  transferName: { fontSize: 13 },
  transferArrow: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  transferActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  noteBtnText: { fontSize: 12 },
  deleteBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 12, padding: 28, borderRadius: 13 },
  emptyText: { fontSize: 13 },

  // Modals
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmBox: { width: '100%', borderRadius: 20, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  confirmTitle: { fontSize: 17, marginBottom: 10 },
  confirmMsg: { fontSize: 14, lineHeight: 21 },
  confirmBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  confirmBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText: { fontSize: 15 },

  imgBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  imgBox: { width: width - 32, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  imgCloseBtn: { position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 18, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  imgFull: { width: '100%', height: height * 0.6 },
  imgFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12 },
  imgTag: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

export default AssetDetailScreen;
