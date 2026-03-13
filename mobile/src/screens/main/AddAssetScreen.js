import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Switch, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Check, ChevronDown, X, Tag, Layers,
  User, Plus, Calendar, Hash,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS, RADIUS } from '../../constants/theme';
import { assetsApi, assetTypesApi, employeesApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';

const { height } = Dimensions.get('window');

// ─── Field renderer ───────────────────────────────────────────────
const DynamicField = ({ field, value, onChange, colors, accentColor }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const inputStyle = [styles.input, {
    color: colors.text,
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    fontFamily: FONTS.regular,
  }];

  if (field.fieldType === 'select') {
    return (
      <>
        <TouchableOpacity
          style={[styles.input, styles.selectBtn, {
            backgroundColor: colors.inputBg,
            borderColor: dropdownOpen ? accentColor : colors.inputBorder,
          }]}
          onPress={() => setDropdownOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[{ flex: 1, fontSize: 15, fontFamily: FONTS.regular }, { color: value ? colors.text : colors.textSubtle }]}>
            {value || `Select ${field.name}`}
          </Text>
          <ChevronDown size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
          <TouchableOpacity style={styles.dropBackdrop} activeOpacity={1} onPress={() => setDropdownOpen(false)}>
            <View style={[styles.dropSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.dropTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>{field.name}</Text>
              {(field.options || []).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropOption, { borderBottomColor: colors.border }, value === opt && { backgroundColor: `${accentColor}12` }]}
                  onPress={() => { onChange(opt); setDropdownOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropOptionText, { color: value === opt ? accentColor : colors.text, fontFamily: value === opt ? FONTS.semiBold : FONTS.regular }]}>
                    {opt}
                  </Text>
                  {value === opt && <Check size={14} color={accentColor} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  if (field.fieldType === 'checkbox') {
    return (
      <TouchableOpacity
        style={[styles.checkRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
        onPress={() => onChange(!value)}
        activeOpacity={0.8}
      >
        <Text style={[{ flex: 1, fontSize: 15, color: colors.text, fontFamily: FONTS.regular }]}>{field.name}</Text>
        <Switch
          value={!!value}
          onValueChange={onChange}
          trackColor={{ false: colors.border, true: accentColor }}
          thumbColor="#fff"
        />
      </TouchableOpacity>
    );
  }

  if (field.fieldType === 'textarea') {
    return (
      <TextInput
        style={[inputStyle, styles.textarea]}
        value={value || ''}
        onChangeText={onChange}
        placeholder={`Enter ${field.name.toLowerCase()}`}
        placeholderTextColor={colors.textSubtle}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    );
  }

  return (
    <TextInput
      style={inputStyle}
      value={value || ''}
      onChangeText={onChange}
      placeholder={`Enter ${field.name.toLowerCase()}`}
      placeholderTextColor={colors.textSubtle}
      keyboardType={field.fieldType === 'number' ? 'decimal-pad' : 'default'}
    />
  );
};

// ─── Section Card ─────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, accentColor, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.cardIconWrap, { backgroundColor: `${accentColor}18` }]}>
        <Icon size={14} color={accentColor} />
      </View>
      <Text style={[styles.cardTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>{title}</Text>
    </View>
    <View style={styles.cardBody}>{children}</View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────
const AddAssetScreen = ({ route, navigation }) => {
  const editItem = route.params?.editItem;
  const isEdit = !!editItem;

  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetTypes, setAssetTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [empPickerOpen, setEmpPickerOpen] = useState(false);

  const [form, setForm] = useState({
    assetTag: editItem?.assetTag || '',
    assetTypeId: editItem?.assetTypeId || '',
    assignedEmployeeId: editItem?.assignedEmployeeId || '',
    imageUrl: editItem?.imageUrl || '',
    fieldValues: editItem?.fieldValues || {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [types, emps] = await Promise.all([
        getCached(CK.ASSET_TYPES),
        getCached(CK.EMPLOYEES),
      ]);
      const typeList = Array.isArray(types) ? types : types?.assetTypes || [];
      const empList = Array.isArray(emps) ? emps : emps?.employees || [];
      setAssetTypes(typeList);
      setEmployees(empList);

      if (isEdit && editItem?.assetTypeId) {
        const t = typeList.find(t => t.id === editItem.assetTypeId || t._id === editItem.assetTypeId);
        setSelectedType(t || null);
      }
    } catch (e) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setForm(prev => ({ ...prev, assetTypeId: type.id || type._id, fieldValues: {} }));
    setTypePickerOpen(false);
  };

  const handleFieldChange = (fieldId, value) => {
    setForm(prev => ({ ...prev, fieldValues: { ...prev.fieldValues, [fieldId]: value } }));
  };

  const isFormValid = () => {
    if (!form.assetTypeId) return false;
    if (!selectedType?.fields) return true;
    for (const field of selectedType.fields) {
      if (field.required && !form.fieldValues[field.id]) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        assetTag: form.assetTag || undefined,
        assetTypeId: form.assetTypeId,
        assignedEmployeeId: form.assignedEmployeeId || null,
        imageUrl: form.imageUrl || '',
        fieldValues: form.fieldValues,
      };
      if (isEdit) {
        await assetsApi.update(editItem._id || editItem.id, payload);
        showToast('Asset updated', 'success');
      } else {
        await assetsApi.create(payload);
        showToast('Asset created', 'success');
      }
      await invalidate(CK.ASSETS, CK.DASHBOARD);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      showToast(e.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} asset`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedEmployee = employees.find(e => (e.id || e._id) === form.assignedEmployeeId);

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

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.bold }]}>
          {isEdit ? 'Edit Asset' : 'Add Asset'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isFormValid()}
          style={[styles.saveHeaderBtn, { backgroundColor: isFormValid() ? accentColor : colors.inputBg, opacity: saving ? 0.6 : 1 }]}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Check size={16} color={isFormValid() ? '#fff' : colors.textMuted} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Asset Type picker ── */}
        <SectionCard title="Asset Type *" icon={Layers} accentColor={accentColor} colors={colors}>
          <TouchableOpacity
            style={[styles.input, styles.selectBtn, {
              backgroundColor: colors.inputBg,
              borderColor: selectedType ? accentColor : colors.inputBorder,
            }]}
            onPress={() => setTypePickerOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[{ flex: 1, fontSize: 15, fontFamily: FONTS.regular }, {
              color: selectedType ? colors.text : colors.textSubtle,
            }]}>
              {selectedType ? selectedType.name : 'Select asset type'}
            </Text>
            <ChevronDown size={16} color={colors.textMuted} />
          </TouchableOpacity>
          {assetTypes.length === 0 && (
            <Text style={[styles.hint, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
              No asset types found. Add them in Settings → Asset Types.
            </Text>
          )}
        </SectionCard>

        {/* ── Asset Tag ── */}
        <SectionCard title="Asset Tag" icon={Tag} accentColor={accentColor} colors={colors}>
          <TextInput
            style={[styles.input, {
              color: colors.text, backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder, fontFamily: FONTS.regular,
            }]}
            value={form.assetTag}
            onChangeText={v => setForm(prev => ({ ...prev, assetTag: v }))}
            placeholder="e.g. LAP-001  (leave empty to auto-generate)"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="characters"
          />
          <Text style={[styles.hint, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
            Leave empty to auto-generate a unique identifier
          </Text>
        </SectionCard>

        {/* ── Dynamic Fields ── */}
        {selectedType?.fields?.length > 0 && (
          <SectionCard title={`${selectedType.name} Fields`} icon={Hash} accentColor={accentColor} colors={colors}>
            {selectedType.fields.map(field => (
              <View key={field.id} style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                  {field.name}
                  {field.required && <Text style={{ color: colors.error }}> *</Text>}
                </Text>
                <DynamicField
                  field={field}
                  value={form.fieldValues[field.id]}
                  onChange={v => handleFieldChange(field.id, v)}
                  colors={colors}
                  accentColor={accentColor}
                />
              </View>
            ))}
          </SectionCard>
        )}

        {selectedType && (!selectedType.fields || selectedType.fields.length === 0) && (
          <View style={[styles.emptyFields, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.emptyFieldsText, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              No custom fields for {selectedType.name}.
            </Text>
            <Text style={[styles.emptyFieldsHint, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
              Go to Settings → Asset Types to add fields.
            </Text>
          </View>
        )}

        {/* ── Assignment ── */}
        <SectionCard title="Assign to Employee (Optional)" icon={User} accentColor={accentColor} colors={colors}>
          <TouchableOpacity
            style={[styles.input, styles.selectBtn, {
              backgroundColor: colors.inputBg,
              borderColor: selectedEmployee ? accentColor : colors.inputBorder,
            }]}
            onPress={() => setEmpPickerOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[{ flex: 1, fontSize: 15, fontFamily: FONTS.regular }, {
              color: selectedEmployee ? colors.text : colors.textSubtle,
            }]}>
              {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.employeeId})` : 'None (Inventory)'}
            </Text>
            <ChevronDown size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </SectionCard>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, {
            backgroundColor: isFormValid() ? accentColor : colors.inputBg,
            opacity: saving ? 0.6 : 1,
          }]}
          onPress={handleSave}
          disabled={saving || !isFormValid()}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.saveBtnText, { color: isFormValid() ? '#fff' : colors.textMuted, fontFamily: FONTS.semiBold }]}>
                {isEdit ? 'Update Asset' : 'Create Asset'}
              </Text>}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Asset Type Picker Modal ── */}
      <Modal visible={typePickerOpen} transparent animationType="slide" onRequestClose={() => setTypePickerOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setTypePickerOpen(false)} activeOpacity={1} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Select Asset Type</Text>
              <TouchableOpacity onPress={() => setTypePickerOpen(false)} style={[styles.sheetCloseBtn, { backgroundColor: colors.inputBg }]}>
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false}>
              {assetTypes.map(type => {
                const isSelected = (type.id || type._id) === form.assetTypeId;
                return (
                  <TouchableOpacity
                    key={type.id || type._id}
                    style={[styles.pickerOption, { borderBottomColor: colors.border }, isSelected && { backgroundColor: `${accentColor}12` }]}
                    onPress={() => handleTypeSelect(type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerOptionIcon, { backgroundColor: `${accentColor}18` }]}>
                      <Layers size={14} color={accentColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerOptionText, { color: colors.text, fontFamily: FONTS.semiBold }]}>{type.name}</Text>
                      <Text style={[styles.pickerOptionSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
                        {type.fields?.length || 0} fields
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={accentColor} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Employee Picker Modal ── */}
      <Modal visible={empPickerOpen} transparent animationType="slide" onRequestClose={() => setEmpPickerOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setEmpPickerOpen(false)} activeOpacity={1} />
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold }]}>Assign to Employee</Text>
              <TouchableOpacity onPress={() => setEmpPickerOpen(false)} style={[styles.sheetCloseBtn, { backgroundColor: colors.inputBg }]}>
                <X size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: height * 0.5 }} showsVerticalScrollIndicator={false}>
              {/* None option */}
              <TouchableOpacity
                style={[styles.pickerOption, { borderBottomColor: colors.border }, !form.assignedEmployeeId && { backgroundColor: `${accentColor}12` }]}
                onPress={() => { setForm(prev => ({ ...prev, assignedEmployeeId: '' })); setEmpPickerOpen(false); }}
                activeOpacity={0.7}
              >
                <View style={[styles.pickerOptionIcon, { backgroundColor: colors.inputBg }]}>
                  <User size={14} color={colors.textMuted} />
                </View>
                <Text style={[styles.pickerOptionText, { color: colors.text, fontFamily: FONTS.semiBold, flex: 1 }]}>
                  None (Inventory)
                </Text>
                {!form.assignedEmployeeId && <Check size={16} color={accentColor} />}
              </TouchableOpacity>
              {employees.map(emp => {
                const empId = emp.id || emp._id;
                const isSelected = form.assignedEmployeeId === empId;
                return (
                  <TouchableOpacity
                    key={empId}
                    style={[styles.pickerOption, { borderBottomColor: colors.border }, isSelected && { backgroundColor: `${accentColor}12` }]}
                    onPress={() => { setForm(prev => ({ ...prev, assignedEmployeeId: empId })); setEmpPickerOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.pickerOptionIcon, { backgroundColor: `${accentColor}18` }]}>
                      <Text style={[{ fontSize: 12, color: accentColor, fontFamily: FONTS.bold }]}>
                        {(emp.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerOptionText, { color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
                      <Text style={[styles.pickerOptionSub, { color: colors.textMuted, fontFamily: FONTS.regular }]}>{emp.employeeId}</Text>
                    </View>
                    {isSelected && <Check size={16} color={accentColor} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16 },
  saveHeaderBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, gap: 12 },

  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13 },

  input: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 15,
  },
  textarea: {
    height: 88, paddingTop: 12, paddingBottom: 12,
    textAlignVertical: 'top',
  },
  selectBtn: {
    flexDirection: 'row', alignItems: 'center',
  },
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14,
  },

  hint: { fontSize: 12, marginTop: 4 },

  emptyFields: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 20, alignItems: 'center', gap: 4,
    borderStyle: 'dashed',
  },
  emptyFieldsText: { fontSize: 14 },
  emptyFieldsHint: { fontSize: 12 },

  saveBtn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 16 },

  // Bottom sheets
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, paddingBottom: 40,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  sheetTitle: { fontSize: 17 },
  sheetCloseBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerOptionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerOptionText: { fontSize: 15 },
  pickerOptionSub: { fontSize: 12, marginTop: 1 },

  // Inline dropdown
  dropBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  dropSheet: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  dropTitle: { fontSize: 15, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  dropOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  dropOptionText: { flex: 1, fontSize: 15 },
});

export default AddAssetScreen;
