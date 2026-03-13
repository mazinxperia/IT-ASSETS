import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, RefreshControl,
  Alert, Animated, Dimensions, Modal, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  Shield, Trash2, Eye, EyeOff, UserPlus, ChevronRight,
  Mail, Lock, Crown, User, X, Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import PageHeader from '../../components/PageHeader';
import { getColors, FONTS } from '../../constants/theme';
import { usersApi } from '../../services/api';
import { ROLES } from '../../constants/config';
import { SkeletonList } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';

const { width } = Dimensions.get('window');

const ROLE_META = {
  SUPER_ADMIN: { label: 'Super Admin', color: '#f43f5e', Icon: Crown },
  ADMIN:       { label: 'Admin',       color: '#f59e0b', Icon: Shield },
  USER:        { label: 'User',        color: '#3b82f6', Icon: User  },
};

// ─── Profile initials ────────────────────────────────────────
function initials(name, email) {
  const src = name || email || '?';
  return src.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Current User Card ───────────────────────────────────────
const MyProfileCard = ({ user, accentColor, colors }) => {
  const [showPass, setShowPass] = useState(false);
  const meta = ROLE_META[user?.role] || ROLE_META.USER;
  const RoleIcon = meta.Icon;

  return (
    <View style={[card.wrap, { backgroundColor: colors.surface, borderColor: accentColor + '30' }]}>
      {/* Accent blob */}
      <View style={[card.blob, { backgroundColor: accentColor + '18' }]} />

      <View style={card.top}>
        {/* Avatar */}
        <View style={[card.avatar, { backgroundColor: accentColor }]}>
          <Text style={[card.avatarTxt, { fontFamily: FONTS.bold }]}>
            {initials(user?.name, user?.email)}
          </Text>
        </View>

        <View style={card.info}>
          <Text style={[card.name, { color: colors.onSurface, fontFamily: FONTS.bold }]} numberOfLines={1}>
            {user?.name || 'Admin'}
          </Text>
          <View style={[card.badge, { backgroundColor: meta.color + '20' }]}>
            <RoleIcon size={11} color={meta.color} strokeWidth={2.5} />
            <Text style={[card.badgeTxt, { color: meta.color, fontFamily: FONTS.semiBold }]}>
              {meta.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={[card.divider, { backgroundColor: colors.outlineVariant }]} />

      {/* Email row */}
      <View style={card.row}>
        <View style={[card.fieldIcon, { backgroundColor: accentColor + '15' }]}>
          <Mail size={14} color={accentColor} strokeWidth={2.2} />
        </View>
        <View style={card.fieldContent}>
          <Text style={[card.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>Email</Text>
          <Text style={[card.fieldValue, { color: colors.onSurface, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
            {user?.email || '—'}
          </Text>
        </View>
      </View>

      {/* Password row */}
      <View style={card.row}>
        <View style={[card.fieldIcon, { backgroundColor: accentColor + '15' }]}>
          <Lock size={14} color={accentColor} strokeWidth={2.2} />
        </View>
        <View style={card.fieldContent}>
          <Text style={[card.fieldLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]}>Password</Text>
          <Text style={[card.fieldValue, { color: colors.onSurface, fontFamily: FONTS.semiBold }]}>
            {showPass ? (user?.password || user?.rawPassword || 'Hidden by server') : '••••••••'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowPass(v => !v)} style={card.eyeBtn} hitSlop={8}>
          {showPass
            ? <EyeOff size={18} color={colors.onSurfaceVariant} strokeWidth={1.8} />
            : <Eye    size={18} color={colors.onSurfaceVariant} strokeWidth={1.8} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const card = StyleSheet.create({
  wrap:       { marginHorizontal: 16, borderRadius: 24, padding: 20, borderWidth: 1.5, overflow: 'hidden', marginBottom: 8 },
  blob:       { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60 },
  top:        { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar:     { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { color: '#fff', fontSize: 20 },
  info:       { flex: 1, gap: 6 },
  name:       { fontSize: 18 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeTxt:   { fontSize: 11 },
  divider:    { height: 1, marginBottom: 14 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  fieldIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, marginBottom: 2 },
  fieldValue: { fontSize: 14 },
  eyeBtn:     { padding: 4 },
});

// ─── Add User Modal ───────────────────────────────────────────
const AddUserModal = ({ visible, onClose, onAdd, accentColor, colors }) => {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [role,  setRole]  = useState('USER');
  const [showP, setShowP] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => { setName(''); setEmail(''); setPass(''); setRole('USER'); setShowP(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!email.trim() || !pass.trim()) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await onAdd({ name: name.trim(), email: email.trim(), password: pass, role });
      close();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const ROLES_LIST = [
    { key: 'USER',        label: 'User',       color: '#3b82f6' },
    { key: 'ADMIN',       label: 'Admin',      color: '#f59e0b' },
    { key: 'SUPER_ADMIN', label: 'Super Admin', color: '#f43f5e' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[modal.root, { backgroundColor: colors.background }]}>

          {/* Header */}
          <View style={[modal.header, { borderBottomColor: colors.outlineVariant }]}>
            <TouchableOpacity onPress={close} style={[modal.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
              <X size={20} color={colors.onSurface} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={[modal.title, { color: colors.onSurface, fontFamily: FONTS.bold }]}>Add User</Text>
            <TouchableOpacity
              onPress={submit}
              style={[modal.addBtn, { backgroundColor: loading ? accentColor + '80' : accentColor }]}
              disabled={loading}
            >
              <Check size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>

            {/* Name */}
            <View style={[modal.field, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <User size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name (optional)"
                placeholderTextColor={colors.onSurfaceVariant}
                style={[modal.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
              />
            </View>

            {/* Email */}
            <View style={[modal.field, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Mail size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address *"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[modal.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
              />
            </View>

            {/* Password */}
            <View style={[modal.field, { backgroundColor: colors.surfaceVariant, borderColor: colors.outlineVariant }]}>
              <Lock size={16} color={colors.onSurfaceVariant} strokeWidth={2} />
              <TextInput
                value={pass}
                onChangeText={setPass}
                placeholder="Password *"
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry={!showP}
                style={[modal.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
              />
              <TouchableOpacity onPress={() => setShowP(v => !v)} hitSlop={8}>
                {showP
                  ? <EyeOff size={16} color={colors.onSurfaceVariant} />
                  : <Eye    size={16} color={colors.onSurfaceVariant} />}
              </TouchableOpacity>
            </View>

            {/* Role picker */}
            <Text style={[modal.sectionLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.semiBold }]}>ROLE</Text>
            <View style={modal.roleRow}>
              {ROLES_LIST.map(r => (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={[
                    modal.roleChip,
                    { borderColor: r.key === role ? r.color : colors.outlineVariant,
                      backgroundColor: r.key === role ? r.color + '18' : colors.surfaceVariant }
                  ]}
                >
                  <Text style={[modal.roleChipTxt, {
                    color: r.key === role ? r.color : colors.onSurfaceVariant,
                    fontFamily: r.key === role ? FONTS.semiBold : FONTS.regular,
                  }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modal = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:       { flex: 1, textAlign: 'center', fontSize: 17 },
  addBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  field:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52 },
  input:       { flex: 1, fontSize: 15 },
  sectionLabel:{ fontSize: 11, letterSpacing: 1.2, marginTop: 4 },
  roleRow:     { flexDirection: 'row', gap: 8 },
  roleChip:    { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  roleChipTxt: { fontSize: 12 },
});

// ─── User Row ─────────────────────────────────────────────────
const UserRow = ({ item, onDelete, accentColor, colors, currentUser, isLast }) => {
  const meta   = ROLE_META[item.role] || ROLE_META.USER;
  const RoleIcon = meta.Icon;
  const isSelf = (item._id || item.id) === (currentUser?._id || currentUser?.id);
  const canDel = !isSelf && currentUser?.role === ROLES.SUPER_ADMIN;

  return (
    <View style={[row.wrap, {
      backgroundColor: colors.surface,
      borderColor: colors.outlineVariant,
      borderBottomWidth: isLast ? 0 : 1,
    }]}>
      <View style={[row.avatar, { backgroundColor: meta.color + '18' }]}>
        <Text style={[row.avatarTxt, { color: meta.color, fontFamily: FONTS.bold }]}>
          {initials(item.name, item.email)}
        </Text>
      </View>

      <View style={row.content}>
        <View style={row.nameRow}>
          <Text style={[row.name, { color: colors.onSurface, fontFamily: FONTS.semiBold }]} numberOfLines={1}>
            {item.name || item.email?.split('@')[0] || 'User'}
          </Text>
          {isSelf && (
            <View style={[row.youBadge, { backgroundColor: accentColor + '20' }]}>
              <Text style={[row.youTxt, { color: accentColor, fontFamily: FONTS.semiBold }]}>You</Text>
            </View>
          )}
        </View>
        <Text style={[row.email, { color: colors.onSurfaceVariant, fontFamily: FONTS.regular }]} numberOfLines={1}>
          {item.email || ''}
        </Text>
      </View>

      <View style={[row.roleBadge, { backgroundColor: meta.color + '18' }]}>
        <RoleIcon size={11} color={meta.color} strokeWidth={2.5} />
        <Text style={[row.roleText, { color: meta.color, fontFamily: FONTS.semiBold }]}>{meta.label}</Text>
      </View>

      {canDel && (
        <TouchableOpacity onPress={() => onDelete(item)} style={row.delBtn} hitSlop={8}>
          <Trash2 size={16} color={colors.error} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const row = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatar:    { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 15 },
  content:   { flex: 1 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  name:      { fontSize: 15, flexShrink: 1 },
  email:     { fontSize: 12 },
  youBadge:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  youTxt:    { fontSize: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText:  { fontSize: 10 },
  delBtn:    { padding: 6 },
});

// ─── Main Screen ──────────────────────────────────────────────
const UsersScreen = ({ tabAnim, tabIndex = 2 }) => {
  const theme       = useAppStore(s => s.theme);
  const isConnected = useAppStore(s => s.isConnected);
  const accentColor = useAccentColor();
  const user        = useAppStore(s => s.user);
  const showToast   = useAppStore(s => s.showToast);
  const colors      = getColors(theme, accentColor, isConnected);

  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [addModal,  setAddModal]  = useState(false);

  const listParallax = tabAnim
    ? tabAnim.interpolate({
        inputRange: [(tabIndex - 1) * width, tabIndex * width, (tabIndex + 1) * width],
        outputRange: [width * 0.2, 0, -width * 0.2],
        extrapolate: 'clamp',
      })
    : null;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await usersApi.list();
      setUsers(Array.isArray(res.data) ? res.data : res.data?.users || []);
    } catch (e) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleDelete = (u) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete User', `Remove ${u.name || u.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await usersApi.delete(u._id || u.id);
            showToast('User deleted', 'success');
            fetchUsers();
          } catch { showToast('Failed to delete user', 'error'); }
        },
      },
    ]);
  };

  const handleAdd = async (data) => {
    await usersApi.create(data);
    showToast('User created', 'success');
    fetchUsers();
  };

  // Separate self from others
  const otherUsers = users.filter(u => (u._id || u.id) !== (user?._id || user?.id));
  const canAdd = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

  return (
    <SafeAreaView style={[st.safe, { backgroundColor: colors.background }]} edges={[]}>
      <PageHeader title="Users" colors={colors} tabAnim={tabAnim} tabIndex={tabIndex} />

      <Animated.View style={[st.flex, listParallax ? { transform: [{ translateX: listParallax }] } : null]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} colors={[accentColor]} />}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* My Profile Card */}
          <Text style={[st.sectionLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.semiBold }]}>MY ACCOUNT</Text>
          <MyProfileCard user={user} accentColor={accentColor} colors={colors} />

          {/* Other users section */}
          <View style={st.sectionHeader}>
            <Text style={[st.sectionLabel, { color: colors.onSurfaceVariant, fontFamily: FONTS.semiBold, marginBottom: 0 }]}>
              TEAM ({otherUsers.length})
            </Text>
            {canAdd && (
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAddModal(true); }}
                style={[st.addBtn, { backgroundColor: accentColor }]}
              >
                <UserPlus size={15} color="#fff" strokeWidth={2.2} />
                <Text style={[st.addBtnTxt, { fontFamily: FONTS.semiBold }]}>Add User</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={[st.usersCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <SkeletonList count={3} colors={colors} />
            </View>
          ) : otherUsers.length === 0 ? (
            <View style={[st.usersCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <EmptyState type="default" title="No other users" message="Invite team members to get started." colors={colors} />
            </View>
          ) : (
            <View style={[st.usersCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              {otherUsers.map((u, i) => (
                <UserRow
                  key={u._id || u.id || i}
                  item={u}
                  onDelete={handleDelete}
                  accentColor={accentColor}
                  colors={colors}
                  currentUser={user}
                  isLast={i === otherUsers.length - 1}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <AddUserModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onAdd={handleAdd}
        accentColor={accentColor}
        colors={colors}
      />
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  safe:          { flex: 1 },
  flex:          { flex: 1 },
  sectionLabel:  { fontSize: 11, letterSpacing: 1.3, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnTxt:     { color: '#fff', fontSize: 13 },
  usersCard:     { marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
});

export default UsersScreen;
