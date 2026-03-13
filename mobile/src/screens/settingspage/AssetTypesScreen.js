// settings/AssetTypesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text, ActivityIndicator, Portal, Dialog, Button,
  TextInput, List, IconButton, Divider,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Package } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, getColors } from '../../constants/theme';
import { assetTypesApi } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';

const { height } = Dimensions.get('window');

const FIELD_TYPES = [
  { value: 'text',     label: 'Text',      icon: 'format-text' },
  { value: 'number',   label: 'Number',    icon: 'numeric' },
  { value: 'textarea', label: 'Long Text', icon: 'text-long' },
  { value: 'select',   label: 'Dropdown',  icon: 'chevron-down-circle-outline' },
  { value: 'date',     label: 'Date',      icon: 'calendar-outline' },
  { value: 'checkbox', label: 'Checkbox',  icon: 'checkbox-outline' },
];



export default function AssetTypesScreen({ onClose }) {
  const theme       = useAppStore(s => s.theme);
  const accentColor = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const showToast        = useAppStore(s => s.showToast);
  const showOfflineError = useAppStore(s => s.showOfflineError);
  const c = getColors(theme, accentColor, isConnected);

  const [assetTypes, setAssetTypes]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expanded, setExpanded]         = useState(null);
  const [typeDialog, setTypeDialog]     = useState({ open: false, type: null });
  const [typeName, setTypeName]         = useState('');
  const [savingType, setSavingType]     = useState(false);
  const [fieldDialog, setFieldDialog]   = useState({ open: false, typeId: null, field: null });
  const [fieldForm, setFieldForm]       = useState({ name: '', fieldType: 'text', required: false, options: '' });
  const [savingField, setSavingField]   = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [delType, setDelType]           = useState(null);
  const [delField, setDelField]         = useState(null);

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try { const d = await getCached(CK.ASSET_TYPES); setAssetTypes(Array.isArray(d) ? d : []); }
    catch { showToast('Failed to load asset types', 'error'); }
    finally { setLoading(false); }
  };
  const refresh = async () => {
    await invalidate(CK.ASSET_TYPES);
    const d = await getCached(CK.ASSET_TYPES);
    setAssetTypes(Array.isArray(d) ? d : []);
  };
  const handleSaveType = async () => {
    if (!typeName.trim()) return;
    setSavingType(true);
    try {
      typeDialog.type
        ? await assetTypesApi.update(typeDialog.type.id || typeDialog.type._id, { name: typeName })
        : await assetTypesApi.create({ name: typeName });
      showToast(typeDialog.type ? 'Type updated' : 'Type created', 'success');
      await refresh(); setTypeDialog({ open: false, type: null }); setTypeName('');
    } catch { showToast('Failed to save type', 'error'); }
    finally { setSavingType(false); }
  };
  const handleSaveField = async () => {
    if (!fieldForm.name.trim()) return;
    setSavingField(true);
    try {
      const p = {
        name: fieldForm.name.trim(), fieldType: fieldForm.fieldType,
        required: fieldForm.required, showInList: true, showInDetail: true, showInForm: true,
        options: fieldForm.fieldType === 'select' ? fieldForm.options.split(',').map(o => o.trim()).filter(Boolean) : null,
      };
      fieldDialog.field
        ? await assetTypesApi.updateField(fieldDialog.typeId, fieldDialog.field.id, p)
        : await assetTypesApi.createField(fieldDialog.typeId, p);
      showToast(fieldDialog.field ? 'Field updated' : 'Field created', 'success');
      await refresh(); setFieldDialog({ open: false, typeId: null, field: null });
    } catch { showToast('Failed to save field', 'error'); }
    finally { setSavingField(false); }
  };

  const ftIcon  = t => (FIELD_TYPES.find(f => f.value === t) || FIELD_TYPES[0]).icon;
  const ftLabel = t => (FIELD_TYPES.find(f => f.value === t) || FIELD_TYPES[0]).label;
  const ft      = FIELD_TYPES.find(f => f.value === fieldForm.fieldType) || FIELD_TYPES[0];

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: c.background }]}>
            <ChevronLeft size={22} color={c.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text, fontFamily: FONTS.bold }]}>Asset Types</Text>
          <TouchableOpacity onPress={() => { setTypeName(''); setTypeDialog({ open: true, type: null }); }}
            style={[styles.addBtn, { backgroundColor: accentColor }]}>
            <Text style={{ color: '#fff', fontFamily: FONTS.semiBold, fontSize: 14 }}>+ New</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator animating color={accentColor} style={{ marginTop: 40 }} /> : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}>
            {assetTypes.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}>
                <Package size={36} color={c.textMuted} strokeWidth={1.5} />
                <Text style={{ color: c.text, fontFamily: FONTS.semiBold, fontSize: 16, marginTop: 12 }}>No Asset Types</Text>
                <Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 13, marginTop: 4 }}>Tap "+ New" to create your first type</Text>
              </View>
            ) : assetTypes.map(type => {
              const typeId = type.id || type._id;
              const isExp  = expanded === typeId;
              const fields = type.fields || [];
              return (
                <View key={typeId} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                  <TouchableOpacity style={styles.typeRow} onPress={() => setExpanded(isExp ? null : typeId)} activeOpacity={0.8}>
                    <View style={[styles.typeIcon, { backgroundColor: c.primaryContainer }]}>
                      <List.Icon icon="layers-outline" color={accentColor} style={{ margin: 0, width: 20, height: 20 }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontFamily: FONTS.semiBold, fontSize: 15 }}>{type.name}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>{fields.length} field{fields.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <IconButton icon="plus" size={16} iconColor={accentColor} containerColor={c.primaryContainer}
                      onPress={() => { setFieldForm({ name: '', fieldType: 'text', required: false, options: '' }); setFieldDialog({ open: true, typeId, field: null }); }} />
                    <IconButton icon="pencil-outline" size={16} iconColor={c.textMuted} containerColor={c.border}
                      onPress={() => { setTypeName(type.name); setTypeDialog({ open: true, type }); }} />
                    <IconButton icon="delete-outline" size={16} iconColor={c.error} containerColor={c.errorContainer}
                      onPress={() => setDelType(type)} />
                    <List.Icon icon={isExp ? 'chevron-up' : 'chevron-down'} color={c.textMuted} style={{ margin: 0 }} />
                  </TouchableOpacity>

                  {isExp && <>
                    <Divider style={{ backgroundColor: c.border }} />
                    {fields.length === 0 ? (
                      <TouchableOpacity style={styles.emptyFields}
                        onPress={() => { setFieldForm({ name: '', fieldType: 'text', required: false, options: '' }); setFieldDialog({ open: true, typeId, field: null }); }}>
                        <List.Icon icon="plus-circle-outline" color={c.textMuted} style={{ margin: 0 }} />
                        <Text style={{ color: c.textMuted, fontSize: 13 }}>Add first field</Text>
                      </TouchableOpacity>
                    ) : fields.map((field, i) => (
                      <View key={field.id}>
                        <View style={styles.fieldRow}>
                          <View style={[styles.fieldIcon, { backgroundColor: c.primaryContainer }]}>
                            <List.Icon icon={ftIcon(field.fieldType)} color={accentColor} style={{ margin: 0, width: 16, height: 16 }} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: c.text, fontFamily: FONTS.semiBold, fontSize: 13 }}>
                              {field.name}{field.required ? <Text style={{ color: c.error }}> *</Text> : null}
                            </Text>
                            <Text style={{ color: c.textMuted, fontSize: 11 }}>{ftLabel(field.fieldType)}</Text>
                          </View>
                          {!field.locked && <>
                            <IconButton icon="pencil-outline" size={14} iconColor={c.textMuted}
                              onPress={() => { setFieldForm({ name: field.name, fieldType: field.fieldType || 'text', required: field.required || false, options: field.options?.join(', ') || '' }); setFieldDialog({ open: true, typeId, field }); }} />
                            <IconButton icon="delete-outline" size={14} iconColor={c.error} onPress={() => setDelField({ typeId, field })} />
                          </>}
                        </View>
                        {i < fields.length - 1 && <Divider style={{ backgroundColor: c.border, marginLeft: 52 }} />}
                      </View>
                    ))}
                    {fields.length > 0 && (
                      <TouchableOpacity style={[styles.addFieldRow, { borderTopColor: c.border }]}
                        onPress={() => { setFieldForm({ name: '', fieldType: 'text', required: false, options: '' }); setFieldDialog({ open: true, typeId, field: null }); }}>
                        <List.Icon icon="plus" color={accentColor} style={{ margin: 0 }} />
                        <Text style={{ color: accentColor, fontFamily: FONTS.semiBold, fontSize: 13 }}>Add Field</Text>
                      </TouchableOpacity>
                    )}
                  </>}
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Type name dialog */}
      <Portal>
        <Dialog visible={typeDialog.open} onDismiss={() => setTypeDialog({ open: false, type: null })} style={{ backgroundColor: c.card, borderRadius: 28 }}>
          <Dialog.Title style={{ color: c.text, fontFamily: FONTS.bold }}>{typeDialog.type ? 'Edit Type' : 'New Asset Type'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Type Name" value={typeName} onChangeText={setTypeName} mode="outlined" autoFocus
              outlineColor={c.border} activeOutlineColor={accentColor} textColor={c.text}
              style={{ backgroundColor: c.background }} theme={{ colors: { onSurfaceVariant: c.textMuted } }}
              placeholder="e.g. Laptop, Monitor, Phone" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTypeDialog({ open: false, type: null })} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveType} loading={savingType} disabled={!typeName.trim() || savingType}
              buttonColor={accentColor} textColor="#fff" style={{ borderRadius: 20 }}>{typeDialog.type ? 'Update' : 'Create'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Field form dialog */}
      <Portal>
        <Dialog visible={fieldDialog.open} onDismiss={() => setFieldDialog({ open: false, typeId: null, field: null })}
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
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setFieldDialog({ open: false, typeId: null, field: null })} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveField} loading={savingField} disabled={!fieldForm.name.trim() || savingField}
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
              {FIELD_TYPES.map(ftype => (
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

      {/* Delete type */}
      <Portal>
        <Dialog visible={!!delType} onDismiss={() => setDelType(null)} style={{ backgroundColor: c.card, borderRadius: 28 }}>
          <Dialog.Icon icon="alert-circle-outline" color={c.error} size={28} />
          <Dialog.Title style={{ textAlign: 'center', color: c.text, fontFamily: FONTS.bold }}>Delete Type</Dialog.Title>
          <Dialog.Content><Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 14 }}>Delete "{delType?.name}"? All assets using this type will be affected.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDelType(null)} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" buttonColor={c.error} textColor="#fff" style={{ borderRadius: 20 }}
              onPress={async () => { try { await assetTypesApi.delete(delType.id || delType._id); await refresh(); showToast('Type deleted', 'success'); } catch { showToast('Failed', 'error'); } finally { setDelType(null); } }}>
              Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete field */}
      <Portal>
        <Dialog visible={!!delField} onDismiss={() => setDelField(null)} style={{ backgroundColor: c.card, borderRadius: 28 }}>
          <Dialog.Icon icon="alert-circle-outline" color={c.error} size={28} />
          <Dialog.Title style={{ textAlign: 'center', color: c.text, fontFamily: FONTS.bold }}>Delete Field</Dialog.Title>
          <Dialog.Content><Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 14 }}>Delete "{delField?.field?.name}"? Cannot be undone.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDelField(null)} textColor={c.textMuted}>Cancel</Button>
            <Button mode="contained" buttonColor={c.error} textColor="#fff" style={{ borderRadius: 20 }}
              onPress={async () => { try { await assetTypesApi.deleteField(delField.typeId, delField.field.id); await refresh(); showToast('Field deleted', 'success'); } catch { showToast('Failed', 'error'); } finally { setDelField(null); } }}>
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

  card:        { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  empty:       { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 40, alignItems: 'center' },
  typeRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  typeIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  fieldIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyFields: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  addFieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  pickerRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  typeSelector:{ flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 4, borderWidth: 1, paddingHorizontal: 14 },
});
