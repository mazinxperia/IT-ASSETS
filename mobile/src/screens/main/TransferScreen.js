import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Alert, Animated, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users, Boxes, Package, ChevronRight, Check, ArrowRight,
  History, X, FileText, Trash2, ArrowLeftRight, Search, Plus} from 'lucide-react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { transfersApi, employeesApi, assetsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 'source',      label: 'Source' },
  { id: 'assets',      label: 'Assets' },
  { id: 'destination', label: 'Destination' },
  { id: 'confirm',     label: 'Confirm' },
];

const getInitials = (name) =>
  (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getModelNumber = (asset) => {
  if (!asset?.fieldValues || !asset?.assetType?.fields) return asset?.assetTag || '';
  const mf = asset.assetType.fields.find(f =>
    f.name?.toLowerCase().includes('model') || f.showInList
  );
  if (mf && asset.fieldValues[mf.id]) return asset.fieldValues[mf.id];
  const first = Object.values(asset.fieldValues)[0];
  return first || asset.assetTag || '';
};

// ─── Step Indicator ───────────────────────────────────────────────
const StepIndicator = ({ currentStep, colors, accentColor }) => (
  <View style={styles.stepperRow}>
    {STEPS.map((step, i) => {
      const done = i < currentStep;
      const active = i === currentStep;
      return (
        <React.Fragment key={step.id}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              done && { backgroundColor: accentColor, borderColor: accentColor },
              active && { borderColor: accentColor, backgroundColor: `${accentColor}18` },
              !done && !active && { borderColor: colors.border, backgroundColor: colors.card },
            ]}>
              {done
                ? <Check size={12} color="#fff" />
                : <Text style={[styles.stepNum, { color: active ? accentColor : colors.textSubtle, fontFamily: FONTS.bold }]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, { color: active ? accentColor : done ? colors.textMuted : colors.textSubtle, fontFamily: active ? FONTS.semiBold : FONTS.regular }]}>
              {step.label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, { backgroundColor: i < currentStep ? accentColor : colors.border }]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Source / Destination Card ────────────────────────────────────
const OptionCard = ({ icon: Icon, iconBg, iconColor, title, subtitle, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
      <Icon size={26} color={iconColor} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.optionTitle, { color: colors.text, fontFamily: FONTS.bold }]}>{title}</Text>
      <Text style={[styles.optionSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{subtitle}</Text>
    </View>
    <ChevronRight size={18} color={colors.textSubtle} />
  </TouchableOpacity>
);

// ─── Employee Picker ──────────────────────────────────────────────
const EmployeePicker = ({ employees, assetCounts, onSelect, filterSourceId, colors, accentColor, title, subtitle }) => {
  const [search, setSearch] = useState('');
  const list = employees
    .filter(e => !filterSourceId || (e.id || e._id) !== filterSourceId)
    .filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.employeeId?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.pickerTitle, { color: colors.text, fontFamily: FONTS.bold }]}>{title}</Text>
      {subtitle && <Text style={[styles.pickerSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{subtitle}</Text>}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={14} color={colors.textSubtle} />
        <TextInput
          style={[{ flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.regular }]}
          placeholder="Search employees..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {list.map(emp => {
        const empId = emp.id || emp._id;
        const count = assetCounts?.[empId] || 0;
        const hasAssets = assetCounts ? count > 0 : true;
        return (
          <TouchableOpacity
            key={empId}
            style={[styles.empRow, { borderBottomColor: colors.border, opacity: hasAssets ? 1 : 0.4 }]}
            onPress={() => hasAssets && onSelect(empId)}
            disabled={!hasAssets}
            activeOpacity={0.75}
          >
            <View style={[styles.empAvatar, { backgroundColor: hasAssets ? `${accentColor}18` : colors.inputBg }]}>
              <Text style={[{ fontSize: 13, fontFamily: FONTS.bold, color: hasAssets ? accentColor : colors.textMuted }]}>
                {getInitials(emp.name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
              <Text style={[{ fontSize: 12, color: hasAssets ? accentColor : colors.textMuted, fontFamily: FONTS.regular }]}>
                {assetCounts ? `${count} asset${count !== 1 ? 's' : ''}` : emp.employeeId}
              </Text>
            </View>
            <ChevronRight size={14} color={colors.textSubtle} />
          </TouchableOpacity>
        );
      })}
      {list.length === 0 && (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <Text style={[{ color: colors.textMuted, fontFamily: FONTS.regular, fontSize: 13 }]}>No employees found</Text>
        </View>
      )}
    </View>
  );
};

// ─── History Item ─────────────────────────────────────────────────
const HistoryItem = ({ item, onDelete, onNote, colors, accentColor }) => {
  const date = item.date || item.transfer_date || item.createdAt;
  const formatted = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const time = date ? new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const model = item.assetModelNumber || item.assetTypeName || item.asset?.assetType?.name || 'Asset';
  const typeName = item.assetTypeName || item.asset?.assetType?.name || '';

  return (
    <View style={[styles.histItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.histIcon, { backgroundColor: `${accentColor}14` }]}>
        <ArrowLeftRight size={15} color={accentColor} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{model}</Text>
        {typeName ? <Text style={[{ fontSize: 11, color: colors.textMuted, fontFamily: FONTS.regular }]}>{typeName}</Text> : null}
        <View style={styles.histFlow}>
          <View style={[styles.histBadge, { backgroundColor: colors.inputBg }]}>
            <Text style={[{ fontSize: 10, color: colors.textMuted, fontFamily: FONTS.regular }]}>{item.fromType || 'from'}</Text>
          </View>
          <Text style={[{ fontSize: 12, color: colors.text, fontFamily: FONTS.semiBold, flex: 1 }]} numberOfLines={1}>
            {item.fromName || 'Inventory'}
          </Text>
          <ArrowRight size={11} color={colors.textSubtle} style={{ marginHorizontal: 4 }} />
          <View style={[styles.histBadge, { backgroundColor: colors.inputBg }]}>
            <Text style={[{ fontSize: 10, color: colors.textMuted, fontFamily: FONTS.regular }]}>{item.toType || 'to'}</Text>
          </View>
          <Text style={[{ fontSize: 12, color: colors.text, fontFamily: FONTS.semiBold, flex: 1 }]} numberOfLines={1}>
            {item.toName || 'Inventory'}
          </Text>
        </View>
      </View>
      <View style={styles.histRight}>
        <Text style={[{ fontSize: 10, color: colors.textSubtle, fontFamily: FONTS.regular, textAlign: 'right' }]}>{formatted}</Text>
        <Text style={[{ fontSize: 10, color: colors.textSubtle, fontFamily: FONTS.regular, textAlign: 'right' }]}>{time}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {item.notes ? (
            <TouchableOpacity
              style={[styles.histBtn, { backgroundColor: `${accentColor}14` }]}
              onPress={() => onNote(item.notes)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <FileText size={12} color={accentColor} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.histBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
            onPress={() => onDelete(item.id || item._id)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Trash2 size={12} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────
const TransferScreen = ({ navigation }) => {
  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const isWriteAllowed = user?.role !== ROLES.USER;

  // Data
  const [employees, setEmployees] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View
  const [showHistory, setShowHistory] = useState(false);

  // Wizard state
  const [step, setStep] = useState(0);
  const [sourceType, setSourceType] = useState(null);       // 'employee' | 'inventory'
  const [sourceEmployee, setSourceEmployee] = useState(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [destinationType, setDestinationType] = useState(null); // 'employee' | 'inventory'
  const [destinationEmployee, setDestinationEmployee] = useState(null);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [notePopup, setNotePopup] = useState(null);

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animateStep = () => {
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  };

  // Asset counts per employee
  const assetCounts = {};
  allAssets.forEach(a => {
    if (a.assignedEmployeeId) {
      assetCounts[a.assignedEmployeeId] = (assetCounts[a.assignedEmployeeId] || 0) + 1;
    }
  });

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      const [emps, assets, txs] = await Promise.all([
        getCached(CK.EMPLOYEES),
        getCached(CK.ASSETS),
        getCached(CK.TRANSFERS),
      ]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setAllAssets(Array.isArray(assets) ? assets : []);
      setTransfers(Array.isArray(txs) ? txs : []);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const goStep = (n) => { animateStep(); setStep(n); };

  const handleSourceEmployee = async (empId) => {
    setSourceType('employee');
    setSourceEmployee(empId);
    setShowSourcePicker(false);
    setSelectedAssets([]);
    // Get assets for this employee
    const empAssets = allAssets.filter(a => a.assignedEmployeeId === empId);
    setAvailableAssets(empAssets);
    goStep(1);
  };

  const handleSourceInventory = () => {
    setSourceType('inventory');
    setSourceEmployee(null);
    setShowSourcePicker(false);
    setSelectedAssets([]);
    const inv = allAssets.filter(a => !a.assignedEmployeeId);
    setAvailableAssets(inv);
    goStep(1);
  };

  const toggleAsset = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDestInventory = () => {
    setDestinationType('inventory');
    setDestinationEmployee(null);
    setShowDestPicker(false);
    goStep(3);
  };

  const handleDestEmployee = (empId) => {
    setDestinationType('employee');
    setDestinationEmployee(empId);
    setShowDestPicker(false);
    goStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await transfersApi.create({
        assetIds: selectedAssets,
        fromType: sourceType,
        fromId: sourceEmployee,
        toType: destinationType,
        toId: destinationEmployee,
        notes,
      });
      await invalidate(CK.TRANSFERS, CK.ASSETS, CK.EMPLOYEES, CK.DASHBOARD);
      showToast('Transfer completed!', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Reset
      setStep(0);
      setSourceType(null); setSourceEmployee(null);
      setSelectedAssets([]); setAvailableAssets([]);
      setDestinationType(null); setDestinationEmployee(null);
      setNotes('');
      fetchData();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to complete transfer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransfer = (id) => {
    Alert.alert('Delete Transfer', 'Delete this transfer record? Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await transfersApi.delete(id);
            await invalidate(CK.TRANSFERS);
            setTransfers(prev => prev.filter(t => (t.id || t._id) !== id));
            showToast('Transfer deleted', 'success');
          } catch { showToast('Failed to delete', 'error'); }
        },
      },
    ]);
  };

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const sourceName = sourceType === 'inventory'
    ? 'Inventory'
    : employees.find(e => (e.id || e._id) === sourceEmployee)?.name || '';
  const destName = destinationType === 'inventory'
    ? 'Inventory'
    : employees.find(e => (e.id || e._id) === destinationEmployee)?.name || '';
  const selectedAssetObjects = availableAssets.filter(a => selectedAssets.includes(a.id || a._id));

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 4 }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={28} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>Transfers</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            Transfer assets between employees and inventory
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: showHistory ? accentColor : colors.card, borderColor: showHistory ? accentColor : colors.border }]}
          onPress={() => setShowHistory(!showHistory)}
          activeOpacity={0.85}
        >
          <History size={15} color={showHistory ? '#fff' : colors.textMuted} />
          <Text style={[{ fontSize: 12, fontFamily: FONTS.semiBold, color: showHistory ? '#fff' : colors.textMuted }]}>
            {showHistory ? 'New' : 'History'}
          </Text>
        </TouchableOpacity>
      </View>

      {showHistory ? (
        // ── HISTORY VIEW ──
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: colors.textSubtle, fontFamily: FONTS.semiBold }]}>
            TRANSFER HISTORY · {transfers.length} RECORDS
          </Text>
          {transfers.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ArrowLeftRight size={28} color={colors.textSubtle} />
              <Text style={[{ color: colors.textMuted, fontFamily: FONTS.semiBold, fontSize: 15, marginTop: 12 }]}>No transfers yet</Text>
              <Text style={[{ color: colors.textSubtle, fontFamily: FONTS.regular, fontSize: 13, marginTop: 4 }]}>Complete your first transfer to see history</Text>
            </View>
          ) : (
            transfers.map(t => (
              <HistoryItem
                key={t.id || t._id}
                item={t}
                onDelete={handleDeleteTransfer}
                onNote={setNotePopup}
                colors={colors}
                accentColor={accentColor}
              />
            ))
          )}
        </ScrollView>
      ) : (
        // ── WIZARD VIEW ──
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step indicator */}
          <View style={[styles.stepperCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <StepIndicator currentStep={step} colors={colors} accentColor={accentColor} />
          </View>

          {/* Step content */}
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>

            {/* ── STEP 0: Select Source ── */}
            {step === 0 && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.stepTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Select Source</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Where are the assets coming from?</Text>

                <OptionCard
                  icon={Users}
                  iconBg={`${accentColor}18`}
                  iconColor={accentColor}
                  title="From Employee"
                  subtitle="Transfer assets from an employee"
                  onPress={() => setShowSourcePicker(true)}
                  colors={colors}
                />
                <OptionCard
                  icon={Boxes}
                  iconBg={`${accentColor}12`}
                  iconColor={accentColor}
                  title="From Inventory"
                  subtitle="Assign unassigned assets"
                  onPress={handleSourceInventory}
                  colors={colors}
                />

                {showSourcePicker && (
                  <EmployeePicker
                    employees={employees}
                    assetCounts={assetCounts}
                    onSelect={handleSourceEmployee}
                    colors={colors}
                    accentColor={accentColor}
                    title="Select Source Employee"
                    subtitle="Only employees with assigned assets are shown"
                  />
                )}
              </View>
            )}

            {/* ── STEP 1: Select Assets ── */}
            {step === 1 && (
              <View style={{ gap: 12 }}>
                <View style={styles.stepHeaderRow}>
                  <View>
                    <Text style={[styles.stepTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Select Assets</Text>
                    <Text style={[styles.stepDesc, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                      {selectedAssets.length} selected
                    </Text>
                  </View>
                  {availableAssets.length > 0 && (
                    <TouchableOpacity
                      style={[styles.selectAllBtn, { backgroundColor: `${accentColor}14` }]}
                      onPress={() => setSelectedAssets(
                        selectedAssets.length === availableAssets.length
                          ? []
                          : availableAssets.map(a => a.id || a._id)
                      )}
                    >
                      <Text style={[{ fontSize: 12, color: accentColor, fontFamily: FONTS.semiBold }]}>
                        {selectedAssets.length === availableAssets.length ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {availableAssets.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Package size={24} color={colors.textSubtle} />
                    <Text style={[{ color: colors.textMuted, fontFamily: FONTS.regular, fontSize: 14, marginTop: 8 }]}>No assets available</Text>
                  </View>
                ) : (
                  availableAssets.map(asset => {
                    const id = asset.id || asset._id;
                    const isSel = selectedAssets.includes(id);
                    const model = getModelNumber(asset) || asset.assetType?.name || 'Asset';
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[styles.assetRow, {
                          backgroundColor: isSel ? `${accentColor}12` : colors.card,
                          borderColor: isSel ? accentColor : colors.border,
                        }]}
                        onPress={() => toggleAsset(id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.assetRowCheck, {
                          backgroundColor: isSel ? accentColor : colors.inputBg,
                          borderColor: isSel ? accentColor : colors.inputBorder,
                        }]}>
                          {isSel && <Check size={12} color="#fff" />}
                        </View>
                        <View style={[styles.assetThumb, { backgroundColor: `${accentColor}14` }]}>
                          <Package size={16} color={accentColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{model}</Text>
                          <Text style={[{ fontSize: 12, color: colors.textMuted, fontFamily: FONTS.regular }]}>{asset.assetType?.name || '—'}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}

                <View style={styles.navRow}>
                  <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => goStep(0)}>
                    <Text style={[{ color: colors.text, fontFamily: FONTS.semiBold, fontSize: 14 }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBtnPrimary, { backgroundColor: selectedAssets.length > 0 ? accentColor : colors.border }]}
                    onPress={() => selectedAssets.length > 0 && goStep(2)}
                    disabled={selectedAssets.length === 0}
                  >
                    <Text style={[{ color: '#fff', fontFamily: FONTS.semiBold, fontSize: 14 }]}>Continue</Text>
                    <ChevronRight size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── STEP 2: Select Destination ── */}
            {step === 2 && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.stepTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Select Destination</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Where are the assets going?</Text>

                {sourceType !== 'inventory' && (
                  <OptionCard
                    icon={Boxes}
                    iconBg={`${accentColor}12`}
                    iconColor={accentColor}
                    title="To Inventory"
                    subtitle="Return assets to inventory"
                    onPress={handleDestInventory}
                    colors={colors}
                  />
                )}
                <OptionCard
                  icon={Users}
                  iconBg={`${accentColor}18`}
                  iconColor={accentColor}
                  title="To Employee"
                  subtitle="Assign assets to an employee"
                  onPress={() => setShowDestPicker(true)}
                  colors={colors}
                />

                {showDestPicker && (
                  <EmployeePicker
                    employees={employees}
                    assetCounts={null}
                    onSelect={handleDestEmployee}
                    filterSourceId={sourceEmployee}
                    colors={colors}
                    accentColor={accentColor}
                    title="Select Destination Employee"
                  />
                )}

                <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border, alignSelf: 'flex-start' }]} onPress={() => goStep(1)}>
                  <Text style={[{ color: colors.text, fontFamily: FONTS.semiBold, fontSize: 14 }]}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── STEP 3: Confirm ── */}
            {step === 3 && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.stepTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Confirm Transfer</Text>
                <Text style={[styles.stepDesc, { color: colors.textMuted, fontFamily: FONTS.regular }]}>Review and confirm the transfer details</Text>

                {/* From → To summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.summaryCenter}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[styles.summaryBadge, { backgroundColor: `${accentColor}14` }]}>
                        <Text style={[{ fontSize: 10, color: accentColor, fontFamily: FONTS.semiBold }]}>
                          {(sourceType || '').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.summaryName, { color: colors.text, fontFamily: FONTS.bold }]}>{sourceName}</Text>
                    </View>
                    <View style={[styles.arrowCircle, { backgroundColor: `${accentColor}18` }]}>
                      <ArrowRight size={18} color={accentColor} />
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <View style={[styles.summaryBadge, { backgroundColor: `${accentColor}14` }]}>
                        <Text style={[{ fontSize: 10, color: accentColor, fontFamily: FONTS.semiBold }]}>
                          {(destinationType || '').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.summaryName, { color: colors.text, fontFamily: FONTS.bold }]}>{destName}</Text>
                    </View>
                  </View>
                </View>

                {/* Selected assets */}
                <View style={[styles.confirmAssetsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.confirmAssetsLabel, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>
                    ASSETS ({selectedAssetObjects.length})
                  </Text>
                  {selectedAssetObjects.map(asset => (
                    <View key={asset.id || asset._id} style={[styles.confirmAssetRow, { borderBottomColor: colors.border }]}>
                      <View style={[styles.confirmAssetIcon, { backgroundColor: `${accentColor}14` }]}>
                        <Package size={13} color={accentColor} />
                      </View>
                      <Text style={[{ flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
                        {getModelNumber(asset) || asset.assetType?.name || 'Asset'}
                      </Text>
                      <Text style={[{ fontSize: 12, color: colors.textMuted, fontFamily: FONTS.regular }]}>
                        {asset.assetType?.name}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Notes */}
                <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.notesLabel, { color: colors.textMuted, fontFamily: FONTS.semiBold }]}>NOTES (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.notesInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: FONTS.regular }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any notes about this transfer..."
                    placeholderTextColor={colors.textSubtle}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action buttons */}
                <View style={styles.navRow}>
                  <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => goStep(2)}>
                    <Text style={[{ color: colors.text, fontFamily: FONTS.semiBold, fontSize: 14 }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBtnPrimary, { backgroundColor: accentColor, opacity: submitting ? 0.7 : 1, flex: 1 }]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <>
                          <Check size={15} color="#fff" />
                          <Text style={[{ color: '#fff', fontFamily: FONTS.bold, fontSize: 15, marginLeft: 6 }]}>Confirm Transfer</Text>
                        </>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* ── Note Popup Modal ── */}
      <Modal visible={!!notePopup} transparent animationType="fade" onRequestClose={() => setNotePopup(null)}>
        <TouchableOpacity style={styles.noteBackdrop} activeOpacity={1} onPress={() => setNotePopup(null)}>
          <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.noteHeader}>
              <View style={styles.noteHeaderLeft}>
                <FileText size={15} color={accentColor} />
                <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold, marginLeft: 8 }]}>Transfer Note</Text>
              </View>
              <TouchableOpacity onPress={() => setNotePopup(null)}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[{ fontSize: 14, color: colors.textMuted, fontFamily: FONTS.regular, lineHeight: 21 }]}>
              {notePopup}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 12, marginTop: 2 },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },

  // Stepper
  stepperCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  stepperRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 6 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 11 },
  stepLabel: { fontSize: 10, letterSpacing: 0.2 },
  stepLine: { flex: 1, height: 2, marginBottom: 16, borderRadius: 1 },

  stepTitle: { fontSize: 20 },
  stepDesc: { fontSize: 13, marginTop: -6 },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectAllBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

  // Option cards
  optionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 14 },
  optionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16 },
  optionSub: { fontSize: 12, marginTop: 2 },

  // Employee picker
  pickerCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingTop: 16 },
  pickerTitle: { fontSize: 15, paddingHorizontal: 16 },
  pickerSub: { fontSize: 12, paddingHorizontal: 16, marginTop: 2, marginBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, height: 38, gap: 8, marginBottom: 8 },
  empRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  empAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Asset rows
  assetRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 12, gap: 12 },
  assetRowCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  assetThumb: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  navRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navBtn: { height: 46, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  navBtnPrimary: { flex: 1, height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },

  // Confirm step
  summaryCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 24 },
  summaryCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  summaryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  summaryName: { fontSize: 16, textAlign: 'center', maxWidth: 110 },
  arrowCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  confirmAssetsCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 14, gap: 10 },
  confirmAssetsLabel: { fontSize: 11, letterSpacing: 1 },
  confirmAssetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  confirmAssetIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  notesCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  notesLabel: { fontSize: 11, letterSpacing: 1 },
  notesInput: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 80 },

  // History
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },
  emptyCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 40, alignItems: 'center' },
  histItem: { flexDirection: 'row', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  histIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  histFlow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  histBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, marginRight: 3 },
  histRight: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 70 },
  histBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },

  // Note modal
  noteBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  noteBox: { width: '100%', borderRadius: 20, padding: 20, borderWidth: 1, gap: 12 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
});

export default TransferScreen;
