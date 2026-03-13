import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, Plus, CreditCard, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, X, Edit2, Trash2} from 'lucide-react-native';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { subscriptionsApi, getFileUrl } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';
import { SkeletonList } from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (amount, currency) => {
  if (!amount) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0,
    }).format(amount);
  } catch { return `${currency || ''} ${amount}`; }
};
const formatDate = (s) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const isExpired = (s) => s && new Date(s) < new Date();
const isExpiringSoon = (s) => {
  if (!s) return false;
  const diff = (new Date(s) - new Date()) / 86400000;
  return diff >= 0 && diff <= 30;
};

// ── Logo ──────────────────────────────────────────────────────────
const SubLogo = ({ sub, backendUrl, accentColor, size = 42 }) => {
  const [err, setErr] = useState(false);
  const url = sub.logoFileId ? getFileUrl(backendUrl, sub.logoFileId) : null;
  const r = size * 0.28;
  if (url && !err) {
    return (
      <View style={{ width: size, height: size, borderRadius: r, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={{ uri: url }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setErr(true)} />
      </View>
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: `${accentColor}18`, alignItems: 'center', justifyContent: 'center' }}>
      <CreditCard size={size * 0.44} color={accentColor} />
    </View>
  );
};

// ── Subscription Row ──────────────────────────────────────────────
const SubRow = ({ item, onPress, onEdit, onDelete, colors, accentColor, backendUrl, isWriteAllowed }) => {
  const expired = isExpired(item.renewalDate);
  const expiring = isExpiringSoon(item.renewalDate);
  const statusColor = expired ? '#ef4444' : expiring ? '#f59e0b' : '#22c55e';
  const empCount = (item.assignedEmployeeIds || []).length;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <SubLogo sub={item} backendUrl={backendUrl} accentColor={accentColor} size={44} />

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.rowName, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {item.price ? (
            <Text style={[{ fontSize: 13, color: accentColor, fontFamily: FONTS.bold }]}>
              {formatCurrency(item.price, item.currency)}
            </Text>
          ) : null}
          {item.billingCycle ? (
            <Text style={[{ fontSize: 11, color: colors.textSubtle, fontFamily: FONTS.regular }]}>{item.billingCycle}</Text>
          ) : null}
          {empCount > 0 && (
            <View style={[{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Text style={[{ fontSize: 10, color: '#3b82f6', fontFamily: FONTS.semiBold }]}>{empCount} emp</Text>
            </View>
          )}
        </View>
        {item.renewalDate ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor }} />
            <Text style={[{ fontSize: 11, color: statusColor, fontFamily: FONTS.semiBold }]}>
              {expired ? 'Expired' : expiring ? 'Expiring soon · ' + formatDate(item.renewalDate) : formatDate(item.renewalDate)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <ChevronRight size={14} color={colors.textSubtle} />
        {isWriteAllowed && (
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.inputBg }]}
              onPress={(e) => { e.stopPropagation?.(); onEdit(item); }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Edit2 size={11} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
              onPress={(e) => { e.stopPropagation?.(); onDelete(item); }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Trash2 size={11} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ── Collapsible Group ─────────────────────────────────────────────
const SubGroup = ({ title, items, variant, colors, accentColor, backendUrl, onPress, onEdit, onDelete, isWriteAllowed }) => {
  const anim = useRef(new Animated.Value(1)).current;
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(anim, { toValue: collapsed ? 1 : 0, useNativeDriver: false, bounciness: 0, speed: 20 }).start();
    setCollapsed(c => !c);
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] });
  const opacity = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] });
  const isExpiredGroup = variant === 'expired';
  const iconColor = isExpiredGroup ? '#ef4444' : '#22c55e';
  const Icon = isExpiredGroup ? AlertTriangle : CheckCircle2;

  return (
    <View style={[styles.group, {
      backgroundColor: colors.card,
      borderColor: isExpiredGroup ? 'rgba(239,68,68,0.25)' : colors.border,
    }]}>
      <TouchableOpacity
        style={[styles.groupHeader, { backgroundColor: isExpiredGroup ? 'rgba(239,68,68,0.06)' : `${accentColor}08` }]}
        onPress={toggle}
        activeOpacity={0.8}
      >
        <Icon size={14} color={iconColor} />
        <Text style={[styles.groupTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>{title}</Text>
        <View style={[styles.groupBadge, { backgroundColor: isExpiredGroup ? 'rgba(239,68,68,0.12)' : `${accentColor}14` }]}>
          <Text style={[{ fontSize: 11, fontFamily: FONTS.bold, color: isExpiredGroup ? '#ef4444' : accentColor }]}>{items.length}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={14} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: maxH, opacity, overflow: 'hidden' }}>
        {items.map((item, i) => (
          <View key={item.id || item._id}>
            {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: 12 }} />}
            <SubRow
              item={item}
              onPress={onPress}
              onEdit={onEdit}
              onDelete={onDelete}
              colors={colors}
              accentColor={accentColor}
              backendUrl={backendUrl}
              isWriteAllowed={isWriteAllowed}
            />
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────
const SubscriptionListScreen = ({ navigation }) => {
  const theme = useAppStore(s => s.theme);
  const isConnected = useAppStore(s => s.isConnected);
  const accentColor = useAccentColor();
  const user = useAppStore(s => s.user);
  const backendUrl = useAppStore(s => s.backendUrl);
  const showToast = useAppStore(s => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);
  const isWriteAllowed = user?.role !== ROLES.USER;

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSubs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) await invalidate(CK.SUBSCRIPTIONS);
      const data = await getCached(CK.SUBSCRIPTIONS);
      setSubs(Array.isArray(data) ? data : []);
    } catch { showToast('Failed to load subscriptions', 'error'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSubs(); }, []);

  const handleDelete = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Subscription', `Delete "${item.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await subscriptionsApi.delete(item.id || item._id);
            await invalidate(CK.SUBSCRIPTIONS, CK.DASHBOARD);
            showToast('Subscription deleted', 'success');
            fetchSubs();
          } catch { showToast('Failed to delete', 'error'); }
        },
      },
    ]);
  };

  const filtered = subs.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.department?.toLowerCase().includes(search.toLowerCase())
  );
  const active = filtered.filter(s => !isExpired(s.renewalDate));
  const expired = filtered.filter(s => isExpired(s.renewalDate));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8, marginRight: 4 }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={28} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.bold }]}>Subscriptions</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted, fontFamily: FONTS.regular }]}>
            {subs.length} subscription{subs.length !== 1 ? 's' : ''} tracked
          </Text>
        </View>
        {isWriteAllowed && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: accentColor }]}
            onPress={() => navigation.navigate('AddSubscription')}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <Search size={14} color={colors.textSubtle} />
        <TextInput
          style={[{ flex: 1, fontSize: 14, color: colors.text, fontFamily: FONTS.regular }]}
          placeholder="Search subscriptions..."
          placeholderTextColor={colors.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={13} color={colors.textSubtle} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <SkeletonList count={5} colors={colors} />
      ) : filtered.length === 0 ? (
        <EmptyState
          type="subscriptions"
          title={search ? 'No results found' : 'No subscriptions yet'}
          message={search ? 'Try a different search' : 'Track your SaaS tools and licenses.'}
          actionLabel={isWriteAllowed && !search ? 'Add Subscription' : undefined}
          onAction={isWriteAllowed && !search ? () => navigation.navigate('AddSubscription') : undefined}
          colors={colors}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubs(true); }} tintColor={accentColor} colors={[accentColor]} />}
          showsVerticalScrollIndicator={false}
        >
          {active.length > 0 && (
            <SubGroup
              title="Active Subscriptions" items={active} variant="active"
              colors={colors} accentColor={accentColor} backendUrl={backendUrl}
              onPress={s => navigation.navigate('SubscriptionDetail', { subscription: s })}
              onEdit={s => navigation.navigate('AddSubscription', { editItem: s })}
              onDelete={handleDelete}
              isWriteAllowed={isWriteAllowed}
            />
          )}
          {expired.length > 0 && (
            <SubGroup
              title="Expired / Discontinued" items={expired} variant="expired"
              colors={colors} accentColor={accentColor} backendUrl={backendUrl}
              onPress={s => navigation.navigate('SubscriptionDetail', { subscription: s })}
              onEdit={s => navigation.navigate('AddSubscription', { editItem: s })}
              onDelete={handleDelete}
              isWriteAllowed={isWriteAllowed}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 24 },
  subtitle: { fontSize: 12, marginTop: 2 },
  addBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, marginBottom: 4, gap: 8 },
  group: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 8 },
  groupTitle: { fontSize: 14 },
  groupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowName: { fontSize: 14 },
  actionBtn: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});

export default SubscriptionListScreen;
