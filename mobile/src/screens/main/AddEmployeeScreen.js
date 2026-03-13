import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Check, ChevronDown, X, User, Hash, Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { employeesApi, settingsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';

const { height } = Dimensions.get('window');

// ─── Dynamic Field Input ──────────────────────────────────────────
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
        style={[styles.input, styles.checkRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
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

  const keyboardType =
    field.fieldType === 'number' ? 'decimal-pad' :
    field.fieldType === 'phone' ? 'phone-pad' :
    field.fieldType === 'email' ? 'email-address' : 'default';

  return (
    <TextInput
      style={inputStyle}
      value={value || ''}
      onChangeText={onChange}
      placeholder={`Enter ${field.name.toLowerCase()}`}
      placeholderTextColor={colors.textSubtle}
      keyboardType={keyboardType}
      autoCapitalize={field.fieldType === 'email' ? 'none' : 'sentences'}
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
const AddEmployeeScreen = ({ route, navigation }) => {
  const editItem = route.params?.editItem || route.params?.employee;
  const isEdit = !!editItem;

  const theme = useAppStore((s) => s.theme);
  const isConnected = useAppStore((s) => s.isConnected);
  const accentColor = useAccentColor();
  const showToast = useAppStore((s) => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customFields, setCustomFields] = useState([]);

  const [form, setForm] = useState({
    employeeId: editItem?.employeeId || editItem?.employee_id || '',
    name: editItem?.name || '',
    fieldValues: editItem?.fieldValues || {},
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const fields = await getCached(CK.EMP_FIELDS);
      setCustomFields(Array.isArray(fields) ? fields : []);
    } catch {
      setCustomFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setForm(prev => ({ ...prev, fieldValues: { ...prev.fieldValues, [fieldId]: value } }));
  };

  const isFormValid = () => {
    if (!form.employeeId.trim() || !form.name.trim()) return false;
    for (const field of customFields) {
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
        employeeId: form.employeeId.trim(),
        name: form.name.trim(),
        fieldValues: form.fieldValues,
      };
      if (isEdit) {
        await employeesApi.update(editItem._id || editItem.id, payload);
        showToast('Employee updated', 'success');
      } else {
        await employeesApi.create(payload);
        showToast('Employee created', 'success');
      }
      await invalidate(CK.EMPLOYEES, CK.DASHBOARD);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      showToast(e.response?.data?.detail || `Failed to ${isEdit ? 'update' : 'create'} employee`, 'error');
    } finally {
      setSaving(false);
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
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isFormValid()}
          style={[styles.saveHeaderBtn, { backgroundColor: isFormValid() ? accentColor : colors.inputBg }]}
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

        {/* ── System Fields ── */}
        <SectionCard title="Employee Information" icon={User} accentColor={accentColor} colors={colors}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              Employee ID <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: FONTS.regular }]}
              value={form.employeeId}
              onChangeText={v => setForm(prev => ({ ...prev, employeeId: v }))}
              placeholder="e.g. EMP001"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              Full Name <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: FONTS.regular }]}
              value={form.name}
              onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="words"
            />
          </View>
        </SectionCard>

        {/* ── Custom Fields ── */}
        {customFields.length > 0 && (
          <SectionCard title="Custom Fields" icon={Hash} accentColor={accentColor} colors={colors}>
            {customFields.map(field => (
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

        {customFields.length === 0 && (
          <View style={[styles.emptyCustom, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Users size={20} color={colors.textSubtle} />
            <Text style={[styles.emptyCustomText, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
              No custom fields configured.
            </Text>
            <Text style={[styles.emptyCustomHint, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>
              Go to Settings → Employee Fields to add fields.
            </Text>
          </View>
        )}

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isFormValid() ? accentColor : colors.inputBg, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving || !isFormValid()}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={[styles.saveBtnText, { color: isFormValid() ? '#fff' : colors.textMuted, fontFamily: FONTS.semiBold }]}>
                {isEdit ? 'Update Employee' : 'Create Employee'}
              </Text>}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  selectBtn: { flexDirection: 'row', alignItems: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  emptyCustom: {
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 24, alignItems: 'center', gap: 6,
  },
  emptyCustomText: { fontSize: 14 },
  emptyCustomHint: { fontSize: 12 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 16 },
  dropBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  dropSheet: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  dropTitle: { fontSize: 15, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  dropOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  dropOptionText: { flex: 1, fontSize: 15 },
});

export default AddEmployeeScreen;
