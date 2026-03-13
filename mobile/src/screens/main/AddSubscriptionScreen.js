import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Modal, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Check, Globe, ChevronDown, X, RefreshCw,
  CreditCard, DollarSign, Calendar, Users, FileText, Lock, Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { subscriptionsApi, employeesApi, getFileUrl } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';

const CURRENCIES = ['USD', 'AED', 'EUR', 'GBP', 'SAR', 'INR', 'CAD', 'AUD'];
const BILLING_CYCLES = ['per month', 'per year', 'one time'];
const PAYMENT_METHODS = ['Credit Card', 'Bank Transfer', 'PO'];

// ── Section Card ──────────────────────────────────────────────────
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

// ── Field ─────────────────────────────────────────────────────────
const Field = ({ label, required, children, colors }) => (
  <View style={{ gap: 6 }}>
    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
      {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
    </Text>
    {children}
  </View>
);

// ── Bottom Sheet Picker ───────────────────────────────────────────
const SheetPicker = ({ visible, title, options, value, onSelect, onClose, colors, accentColor }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.sheetBackdrop}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold }]}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map(opt => {
            const sel = value === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.sheetOption, { borderBottomColor: colors.border }, sel && { backgroundColor: `${accentColor}12` }]}
                onPress={() => { onSelect(opt); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={[{ flex: 1, fontSize: 15, color: sel ? accentColor : colors.text, fontFamily: sel ? FONTS.semiBold : FONTS.regular }]}>{opt}</Text>
                {sel && <Check size={15} color={accentColor} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ── Employee Picker Sheet ─────────────────────────────────────────
const EmployeeSheet = ({ visible, employees, selected, onToggle, onClose, colors, accentColor }) => {
  const [search, setSearch] = useState('');
  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.employeeId?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: FONTS.bold, flex: 1, marginBottom: 0 }]}>Assign Employees</Text>
            <TouchableOpacity onPress={onClose} style={[{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }]}>
              <X size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.empSearch, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, marginHorizontal: 16, marginBottom: 6 }]}>
            <TextInput style={[{ flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.regular }]} placeholder="Search..." placeholderTextColor={colors.textSubtle} value={search} onChangeText={setSearch} />
          </View>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {filtered.map(emp => {
              const id = emp.id || emp._id;
              const sel = selected.includes(id);
              const initials = (emp.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.sheetOption, { borderBottomColor: colors.border, gap: 10 }, sel && { backgroundColor: `${accentColor}10` }]}
                  onPress={() => onToggle(id)}
                  activeOpacity={0.75}
                >
                  <View style={[{ width: 34, height: 34, borderRadius: 17, backgroundColor: sel ? `${accentColor}20` : colors.inputBg, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={[{ fontSize: 12, fontFamily: FONTS.bold, color: sel ? accentColor : colors.textMuted }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
                    <Text style={[{ fontSize: 11, color: colors.textMuted, fontFamily: FONTS.regular }]}>{emp.employeeId}</Text>
                  </View>
                  <View style={[{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? accentColor : 'transparent', borderColor: sel ? accentColor : colors.inputBorder }]}>
                    {sel && <Check size={12} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={[{ margin: 16, height: 48, borderRadius: 12, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }]}
            onPress={onClose} activeOpacity={0.85}
          >
            <Text style={[{ color: '#fff', fontFamily: FONTS.semiBold, fontSize: 15 }]}>Done · {selected.length} selected</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────
const AddSubscriptionScreen = ({ route, navigation }) => {
  const editItem = route.params?.editItem;
  const isEdit = !!editItem;

  const theme = useAppStore(s => s.theme);
  const isConnected = useAppStore(s => s.isConnected);
  const accentColor = useAccentColor();
  const backendUrl = useAppStore(s => s.backendUrl);
  const showToast = useAppStore(s => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);

  const [saving, setSaving] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currencyPicker, setCurrencyPicker] = useState(false);
  const [cyclePicker, setCyclePicker] = useState(false);
  const [empPicker, setEmpPicker] = useState(false);

  const [form, setForm] = useState({
    name:                editItem?.name || '',
    username:            editItem?.username || '',
    password:            editItem?.password || '',
    link:                editItem?.link || '',
    price:               editItem?.price?.toString() || '',
    currency:            editItem?.currency || 'USD',
    billingCycle:        editItem?.billingCycle || 'per year',
    assignedEmployeeIds: editItem?.assignedEmployeeIds || [],
    department:          editItem?.department || '',
    renewalDate:         editItem?.renewalDate ? editItem.renewalDate.split('T')[0] : '',
    autopay:             editItem?.autopay || 'manual',
    paymentMethod:       editItem?.paymentMethod || 'Credit Card',
    notes:               editItem?.notes || '',
    logoFileId:          editItem?.logoFileId || null,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    getCached(CK.EMPLOYEES).then(d => setEmployees(Array.isArray(d) ? d : [])).catch(() => {});
    if (editItem?.logoFileId) setLogoPreview(getFileUrl(backendUrl, editItem.logoFileId));
  }, []);

  // Auto-fetch logo on link type (add only, debounced)
  const linkTimer = useRef(null);
  useEffect(() => {
    if (!form.link || isEdit || form.logoFileId) return;
    clearTimeout(linkTimer.current);
    linkTimer.current = setTimeout(() => doFetchLogo(form.link), 1200);
    return () => clearTimeout(linkTimer.current);
  }, [form.link]);

  const doFetchLogo = async (url) => {
    if (!url) return;
    setFetchingLogo(true);
    try {
      const res = await subscriptionsApi.fetchLogo(url);
      const fileId = res.data.fileId;
      set('logoFileId', fileId);
      setLogoPreview(getFileUrl(backendUrl, fileId));
      showToast('Logo fetched!', 'success');
    } catch { /* silent on auto-fetch */ }
    finally { setFetchingLogo(false); }
  };

  const handleFetchManual = async () => {
    if (!form.link) { showToast('Enter a URL first', 'error'); return; }
    setFetchingLogo(true);
    try {
      const res = await subscriptionsApi.fetchLogo(form.link);
      const fileId = res.data.fileId;
      set('logoFileId', fileId);
      setLogoPreview(getFileUrl(backendUrl, fileId));
      showToast('Logo fetched!', 'success');
    } catch { showToast('Failed to fetch logo — try a different URL', 'error'); }
    finally { setFetchingLogo(false); }
  };

  const toggleEmployee = (id) =>
    set('assignedEmployeeIds', form.assignedEmployeeIds.includes(id)
      ? form.assignedEmployeeIds.filter(i => i !== id)
      : [...form.assignedEmployeeIds, id]);

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.link && !payload.link.startsWith('http')) payload.link = 'https://' + payload.link;
      if (isEdit) {
        await subscriptionsApi.update(editItem.id || editItem._id, payload);
        showToast('Subscription updated', 'success');
      } else {
        await subscriptionsApi.create(payload);
        showToast('Subscription added', 'success');
      }
      await invalidate(CK.SUBSCRIPTIONS, CK.DASHBOARD);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const isValid = !!form.name.trim();
  const assignedNames = employees.filter(e => form.assignedEmployeeIds.includes(e.id || e._id)).map(e => e.name);
  const inp = [styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, fontFamily: FONTS.regular }];
  const sel = [...inp, styles.selectRow];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.bold }]}>
          {isEdit ? 'Edit Subscription' : 'Add Subscription'}
        </Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, { backgroundColor: isValid ? accentColor : colors.inputBg }]}
          onPress={handleSave} disabled={saving || !isValid}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Check size={16} color={isValid ? '#fff' : colors.textMuted} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <SectionCard title="Subscription Info" icon={CreditCard} accentColor={accentColor} colors={colors}>
          <Field label="Name" required colors={colors}>
            <TextInput style={inp} value={form.name} onChangeText={v => set('name', v)} placeholder="e.g. Adobe Creative Cloud" placeholderTextColor={colors.textSubtle} />
          </Field>
          <Field label="Department" colors={colors}>
            <TextInput style={inp} value={form.department} onChangeText={v => set('department', v)} placeholder="e.g. Engineering" placeholderTextColor={colors.textSubtle} />
          </Field>
        </SectionCard>

        {/* Link & Logo */}
        <SectionCard title="Link & Logo" icon={Globe} accentColor={accentColor} colors={colors}>
          <Field label="Website / URL" colors={colors}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[...inp, { flex: 1 }]}
                value={form.link}
                onChangeText={v => set('link', v)}
                placeholder="https://..."
                placeholderTextColor={colors.textSubtle}
                keyboardType="url"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.fetchBtn, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}30` }]}
                onPress={handleFetchManual}
                disabled={!form.link || fetchingLogo}
                activeOpacity={0.8}
              >
                {fetchingLogo ? <ActivityIndicator size="small" color={accentColor} /> : <RefreshCw size={14} color={accentColor} />}
              </TouchableOpacity>
            </View>
          </Field>
          {(logoPreview || form.logoFileId) && (
            <View style={[styles.logoRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.logoImgWrap}>
                <Image
                  source={{ uri: logoPreview || getFileUrl(backendUrl, form.logoFileId) }}
                  style={{ width: 44, height: 44 }} resizeMode="contain"
                  onError={() => setLogoPreview(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 13, color: colors.text, fontFamily: FONTS.semiBold }]}>Logo fetched</Text>
                <Text style={[{ fontSize: 11, color: colors.textMuted, fontFamily: FONTS.regular }]}>Shows in subscription list</Text>
              </View>
              <TouchableOpacity style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)' }]}
                onPress={() => { setLogoPreview(null); set('logoFileId', null); }}>
                <Text style={[{ fontSize: 12, color: '#ef4444', fontFamily: FONTS.semiBold }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </SectionCard>

        {/* Credentials */}
        <SectionCard title="Login Credentials" icon={Lock} accentColor={accentColor} colors={colors}>
          <Field label="Username / Email" colors={colors}>
            <TextInput style={inp} value={form.username} onChangeText={v => set('username', v)} placeholder="login@company.com" placeholderTextColor={colors.textSubtle} keyboardType="email-address" autoCapitalize="none" />
          </Field>
          <Field label="Password" colors={colors}>
            <TextInput style={inp} value={form.password} onChangeText={v => set('password', v)} placeholder="••••••••" placeholderTextColor={colors.textSubtle} secureTextEntry />
          </Field>
        </SectionCard>

        {/* Pricing */}
        <SectionCard title="Pricing" icon={DollarSign} accentColor={accentColor} colors={colors}>
          <Field label="Price & Currency" colors={colors}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[...sel, { width: 90 }]} onPress={() => setCurrencyPicker(true)} activeOpacity={0.8}>
                <Text style={[{ flex: 1, fontSize: 15, color: colors.text, fontFamily: FONTS.regular }]}>{form.currency}</Text>
                <ChevronDown size={13} color={colors.textMuted} />
              </TouchableOpacity>
              <TextInput style={[...inp, { flex: 1 }]} value={form.price} onChangeText={v => set('price', v)} placeholder="0.00" placeholderTextColor={colors.textSubtle} keyboardType="decimal-pad" />
            </View>
          </Field>
          <Field label="Billing Cycle" colors={colors}>
            <TouchableOpacity style={sel} onPress={() => setCyclePicker(true)} activeOpacity={0.8}>
              <Text style={[{ flex: 1, fontSize: 15, color: colors.text, fontFamily: FONTS.regular }]}>{form.billingCycle}</Text>
              <ChevronDown size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>
          <Field label="Payment Method" colors={colors}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodChip, { borderColor: form.paymentMethod === m ? accentColor : colors.inputBorder, backgroundColor: form.paymentMethod === m ? `${accentColor}14` : 'transparent' }]}
                  onPress={() => set('paymentMethod', m)} activeOpacity={0.8}
                >
                  <Text style={[{ fontSize: 12, fontFamily: FONTS.semiBold, color: form.paymentMethod === m ? accentColor : colors.textMuted }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Field label="Auto Pay" colors={colors}>
            <View style={[styles.switchRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <Text style={[{ flex: 1, fontSize: 15, color: colors.text, fontFamily: FONTS.regular }]}>
                {form.autopay === 'auto' ? 'Enabled' : 'Disabled'}
              </Text>
              <Switch
                value={form.autopay === 'auto'}
                onValueChange={v => set('autopay', v ? 'auto' : 'manual')}
                trackColor={{ false: colors.border, true: accentColor }}
                thumbColor="#fff"
              />
            </View>
          </Field>
        </SectionCard>

        {/* Renewal */}
        <SectionCard title="Renewal" icon={Calendar} accentColor={accentColor} colors={colors}>
          <Field label="Next Renewal / Expiry Date" colors={colors}>
            <TextInput
              style={inp} value={form.renewalDate} onChangeText={v => set('renewalDate', v)}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSubtle}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
        </SectionCard>

        {/* Employees */}
        <SectionCard title="Assigned Employees" icon={Users} accentColor={accentColor} colors={colors}>
          <TouchableOpacity style={[...sel]} onPress={() => setEmpPicker(true)} activeOpacity={0.8}>
            <Text style={[{ flex: 1, fontSize: 15, color: form.assignedEmployeeIds.length > 0 ? colors.text : colors.textSubtle, fontFamily: FONTS.regular }]} numberOfLines={1}>
              {form.assignedEmployeeIds.length === 0 ? 'Select employees...' : assignedNames.join(', ')}
            </Text>
            {form.assignedEmployeeIds.length > 0 && (
              <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7, backgroundColor: `${accentColor}14`, marginRight: 6 }]}>
                <Text style={[{ fontSize: 11, fontFamily: FONTS.semiBold, color: accentColor }]}>{form.assignedEmployeeIds.length}</Text>
              </View>
            )}
            <ChevronDown size={13} color={colors.textMuted} />
          </TouchableOpacity>
        </SectionCard>

        {/* Notes */}
        <SectionCard title="Notes" icon={FileText} accentColor={accentColor} colors={colors}>
          <TextInput
            style={[...inp, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]}
            value={form.notes} onChangeText={v => set('notes', v)}
            placeholder="Any additional notes..." placeholderTextColor={colors.textSubtle}
            multiline numberOfLines={3}
          />
        </SectionCard>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isValid ? accentColor : colors.inputBg, opacity: saving ? 0.65 : 1 }]}
          onPress={handleSave} disabled={saving || !isValid} activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={[{ fontSize: 16, fontFamily: FONTS.bold, color: isValid ? '#fff' : colors.textMuted }]}>
              {isEdit ? 'Update Subscription' : 'Add Subscription'}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 80 }} />
      </ScrollView>

      <SheetPicker visible={currencyPicker} title="Currency" options={CURRENCIES} value={form.currency} onSelect={v => set('currency', v)} onClose={() => setCurrencyPicker(false)} colors={colors} accentColor={accentColor} />
      <SheetPicker visible={cyclePicker} title="Billing Cycle" options={BILLING_CYCLES} value={form.billingCycle} onSelect={v => set('billingCycle', v)} onClose={() => setCyclePicker(false)} colors={colors} accentColor={accentColor} />
      <EmployeeSheet visible={empPicker} employees={employees} selected={form.assignedEmployeeIds} onToggle={toggleEmployee} onClose={() => setEmpPicker(false)} colors={colors} accentColor={accentColor} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16 },
  saveHeaderBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  selectRow: { flexDirection: 'row', alignItems: 'center' },
  fetchBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  logoImgWrap: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  methodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  saveBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '80%' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetTitle: { fontSize: 17, paddingHorizontal: 20, paddingVertical: 14 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  empSearch: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, height: 38 },
});

export default AddSubscriptionScreen;
