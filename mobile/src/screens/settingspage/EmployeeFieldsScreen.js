// settings/EmployeeFieldsScreen.js
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Portal, Dialog, Button, TextInput, List, IconButton, Divider, Switch } from 'react-native-paper';
import { ChevronLeft, Users } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, getColors } from '../../constants/theme';
import { settingsApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';

const { height } = Dimensions.get('window');

const EMP_FIELD_TYPES = [
  { value: 'text',   label: 'Text',     icon: 'format-text' },
  { value: 'number', label: 'Number',   icon: 'numeric' },
  { value: 'select', label: 'Dropdown', icon: 'chevron-down-circle-outline' },
  { value: 'email',  label: 'Email',    icon: 'email-outline' },
  { value: 'phone',  label: 'Phone',    icon: 'phone-outline' },
  { value: 'date',   label: 'Date',     icon: 'calendar-outline' },
];



export default function EmployeeFieldsScreen({ onClose }) {
  const theme       = useAppStore(s => s.theme);
  const accentColor = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const showToast   = useAppStore(s => s.showToast);
  const c = getColors(theme, accentColor, isConnected);

  const [fields, setFields]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fieldDialog, setFieldDialog] = useState({ open: false, field: null });
  const [fieldForm, setFieldForm]   = useState({ name: '', fieldType: 'text', required: false, options: '' });
  const [saving, setSaving]         = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [delField, setDelField]     = useState(null);

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    try { const d = await getCached(CK.EMP_FIELDS); setFields(Array.isArray(d) ? d : []); }
    catch { setFields([]); }
    finally { setLoading(false); }
  };
  const saveFields = async (updated) => {
    await settingsApi.updateEmployeeFields(updated);
    await invalidate(CK.EMP_FIELDS);
    setFields(updated);
  };
  const handleSave = async () => {
    if (!fieldForm.name.trim()) return;
    setSaving(true);
    try {
      const p = { name: fieldForm.name.trim(), fieldType: fieldForm.fieldType, required: fieldForm.required, options: fieldForm.fieldType === 'select' ? fieldForm.options.split(',').map(o => o.trim()).filter(Boolean) : null };
      const updated = fieldDialog.field
        ? fields.map(f => f.id === fieldDialog.field.id ? { ...f, ...p } : f)
        : [...fields, { ...p, id: Date.now().toString() }];
      await saveFields(updated);
      showToast(fieldDialog.field ? 'Field updated' : 'Field created', 'success');
      setFieldDialog({ open: false, field: null });
    } catch { showToast('Failed to save field', 'error'); }
    finally { setSaving(false); }
  };

  const ftIcon  = t => (EMP_FIELD_TYPES.find(f => f.value === t) || EMP_FIELD_TYPES[0]).icon;
  const ftLabel = t => (EMP_FIELD_TYPES.find(f => f.value === t) || EMP_FIELD_TYPES[0]).label;
  const ft      = EMP_FIELD_TYPES.find(f => f.value === fieldForm.fieldType) || EMP_FIELD_TYPES[0];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: c.background }]}>
            <ChevronLeft size={22} color={c.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text, fontFamily: FONTS.bold }]}>Employee Fields</Text>
          <TouchableOpacity onPress={() => { setFieldForm({ name: '', fieldType: 'text', required: false, options: '' }); setFieldDialog({ open: true, field: null }); }}
            style={[styles.addBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#fff', fontFamily: FONTS.semiBold, fontSize: 14 }}>+ New</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator animating color={accentColor} style={{ marginTop: 40 }} /> : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}>

            {/* System fields */}
            <Text style={[styles.sectionLabel, { color: accentColor, fontFamily: FONTS.semiBold }]}>SYSTEM FIELDS</Text>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[styles.subHeader, { borderBottomColor: c.border }]}>
                <Text style={{ color: c.textMuted, fontFamily: FONTS.semiBold, fontSize: 11 }}>Cannot be removed</Text>
              </View>
              {[{ name: 'Employee ID', icon: 'identifier' }, { name: 'Full Name', icon: 'account-outline' }].map((f, i) => (
                <View key={f.name}>
                  <View style={styles.fieldRow}>
                    <View style={[styles.fieldIcon, { backgroundColor: c.border }]}>
                      <List.Icon icon={f.icon} color={c.textMuted} style={{ margin: 0, width: 20, height: 20 }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14 }}>{f.name}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>Text · Required</Text>
                    </View>
                  </View>
                  {i === 0 && <Divider style={{ backgroundColor: c.border, marginLeft: 68 }} />}
                </View>
              ))}
            </View>

            {/* Custom fields */}
            {fields.length > 0 && <>
              <Text style={[styles.sectionLabel, { color: accentColor, fontFamily: FONTS.semiBold }]}>CUSTOM FIELDS</Text>
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                {fields.map((field, i) => (
                  <View key={field.id}>
                    <View style={styles.fieldRow}>
                      <View style={[styles.fieldIcon, { backgroundColor: c.primaryContainer }]}>
                        <List.Icon icon={ftIcon(field.fieldType)} color={accentColor} style={{ margin: 0, width: 20, height: 20 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: c.text, fontFamily: FONTS.semiBold, fontSize: 14 }}>
                          {field.name}{field.required ? <Text style={{ color: c.error }}> *</Text> : null}
                        </Text>
                        <Text style={{ color: c.textMuted, fontSize: 12 }}>{ftLabel(field.fieldType)}</Text>
                      </View>
                      <IconButton icon="pencil-outline" size={16} iconColor={c.textMuted}
                        onPress={() => { setFieldForm({ name: field.name, fieldType: field.fieldType || 'text', required: field.required || false, options: field.options?.join(', ') || '' }); setFieldDialog({ open: true, field }); }} />
                      <IconButton icon="delete-outline" size={16} iconColor={c.error} onPress={() => setDelField(field)} />
                    </View>
                    {i < fields.length - 1 && <Divider style={{ backgroundColor: c.border, marginLeft: 68 }} />}
                  </View>
                ))}
              </View>
            </>}

            {fields.length === 0 && (
              <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
                <Users size={36} color={c.textMuted} strokeWidth={1.5} />
                <Text style={{ color: c.text, fontFamily: FONTS.semiBold, fontSize: 16, marginTop: 12 }}>No Custom Fields</Text>
                <Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 13, marginTop: 4 }}>Tap "+ New" to add custom employee fields</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Field form */}
      <Portal>
        <Dialog visible={fieldDialog.open} onDismiss={() => setFieldDialog({ open: false, field: null })}
          style={{ backgroundColor: c.card, borderRadius: 28, maxHeight: height * 0.85 }}>
          <Dialog.Title style={{ color: c.text, fontFamily: FONTS.bold }}>{fieldDialog.field ? 'Edit Field' : 'New Field'}</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 20 }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingVertical: 8 }}>
                <TextInput label="Field Name" value={fieldForm.name} onChangeText={v => setFieldForm(p => ({ ...p, name: v }))}
                  mode="outlined" autoFocus outlineColor={c.border} activeOutlineColor={accentColor}
                  textColor={c.text} style={{ backgroundColor: c.background }} theme={{ colors: { onSurfaceVariant: c.textMuted } }} />
                <TouchableOpacity onPress={() => setPickerVisible(true)}
                  style={[styles.typeSelector, { borderColor: c.border, backgroundColor: c.background }]} activeOpacity={0.8}>
                  <List.Icon icon={ft.icon} color={accentColor} style={{ margin: 0, marginRight: 8 }} />
                  <Text style={{ flex: 1, color: c.text, fontSize: 15 }}>{ft.label}</Text>
                  <List.Icon icon="menu-down" color={c.textMuted} style={{ margin: 0 }} />
                </TouchableOpacity>
                {fieldForm.fieldType === 'select' && (
                  <TextInput label="Options (comma-separated)" value={fieldForm.options}
                    onChangeText={v => setFieldForm(p => ({ ...p, options: v }))} mode="outlined"
                    outlineColor={c.border} activeOutlineColor={accentColor} textColor={c.text}
                    style={{ backgroundColor: c.background }} theme={{ colors: { onSurfaceVariant: c.textMuted } }} />
                )}
                <View style={[styles.typeSelector, { borderColor: c.border, backgroundColor: c.background }]}>
                  <Text style={{ flex: 1, color: c.text, fontSize: 15 }}>Required Field</Text>
                  <Switch value={fieldForm.required} onValueChange={v => setFieldForm(p => ({ ...p, required: v }))} color={accentColor} />
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setFieldDialog({ open: false, field: null })} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={!fieldForm.name.trim() || saving}
              buttonColor={accentColor} textColor="#fff" style={{ borderRadius: 20 }}>{fieldDialog.field ? 'Update' : 'Create'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Field type picker */}
      <Portal>
        <Dialog visible={pickerVisible} onDismiss={() => setPickerVisible(false)} style={{ backgroundColor: c.card, borderRadius: 28 }}>
          <Dialog.Title style={{ color: c.text, fontFamily: FONTS.bold }}>Field Type</Dialog.Title>
          <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
            <ScrollView>
              {EMP_FIELD_TYPES.map(ftype => (
                <TouchableOpacity key={ftype.value} onPress={() => { setFieldForm(p => ({ ...p, fieldType: ftype.value })); setPickerVisible(false); }}
                  style={[styles.pickerRow, fieldForm.fieldType === ftype.value && { backgroundColor: accentColor + '15' }]}>
                  <List.Icon icon={ftype.icon} color={fieldForm.fieldType === ftype.value ? accentColor : c.textMuted} style={{ margin: 0, marginRight: 12 }} />
                  <Text style={{ flex: 1, color: fieldForm.fieldType === ftype.value ? accentColor : c.text, fontSize: 15 }}>{ftype.label}</Text>
                  {fieldForm.fieldType === ftype.value && <List.Icon icon="check" color={accentColor} style={{ margin: 0 }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions><Button onPress={() => setPickerVisible(false)} textColor={c.textMuted}>Cancel</Button></Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete confirm */}
      <Portal>
        <Dialog visible={!!delField} onDismiss={() => setDelField(null)} style={{ backgroundColor: c.card, borderRadius: 28 }}>
          <Dialog.Icon icon="alert-circle-outline" color={c.error} size={28} />
          <Dialog.Title style={{ textAlign: 'center', color: c.text, fontFamily: FONTS.bold }}>Delete Field</Dialog.Title>
          <Dialog.Content><Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 14 }}>Delete "{delField?.name}"?</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDelField(null)} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" buttonColor={c.error} textColor="#fff" style={{ borderRadius: 20 }}
              onPress={async () => { try { await saveFields(fields.filter(f => f.id !== delField.id)); showToast('Field deleted', 'success'); } catch { showToast('Failed', 'error'); } finally { setDelField(null); } }}>
              Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:  { flex: 1, fontSize: 20 },
  addBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4, marginTop: 8, marginBottom: 6 },
  card:       { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  empty:      { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 40, alignItems: 'center' },
  subHeader:  { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  fieldIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pickerRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  typeSelector:{ flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 4, borderWidth: 1, paddingHorizontal: 14 },
});
