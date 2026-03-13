import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Image, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Edit2, Trash2, CreditCard, Eye, EyeOff,
  Globe, ExternalLink, Users, Calendar, RefreshCw,
  DollarSign, Building2, FileText, AlertTriangle, CheckCircle2,
  Lock, ChevronRight, Tag,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useAppStore, { useAccentColor } from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/theme';
import { subscriptionsApi, employeesApi, getFileUrl } from '../../services/api';
import { getCached, invalidate, CK } from '../../services/DataCacheService';
import { ROLES } from '../../constants/config';

// ── Helpers ───────────────────────────────────────────────────────
const formatCurrency = (amount, currency) => {
  if (!amount) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(amount);
  } catch { return `${currency || ''} ${amount}`; }
};
const formatDate = (s) => {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
const isExpired = (s) => s && new Date(s) < new Date();
const isExpiringSoon = (s) => {
  if (!s) return false;
  const diff = (new Date(s) - new Date()) / 86400000;
  return diff >= 0 && diff <= 30;
};
const daysUntil = (s) => {
  if (!s) return null;
  return Math.ceil((new Date(s) - new Date()) / 86400000);
};
const getInitials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── FadeIn ────────────────────────────────────────────────────────
const FadeIn = ({ delay = 0, children, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 20, bounciness: 4, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
};

// ── Section Card ──────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, accentColor, colors, delay = 0, badge }) => (
  <FadeIn delay={delay}>
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${accentColor}18` }]}>
          <Icon size={14} color={accentColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: FONTS.semiBold }]}>{title}</Text>
        {badge != null && (
          <View style={[{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${accentColor}14` }]}>
            <Text style={[{ fontSize: 11, fontFamily: FONTS.semiBold, color: accentColor }]}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  </FadeIn>
);

// ── Info Row ──────────────────────────────────────────────────────
const InfoRow = ({ label, value, colors, last = false }) => (
  <View style={[styles.infoRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
    <Text style={[styles.infoLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text, fontFamily: FONTS.semiBold }]} numberOfLines={2}>{value || '—'}</Text>
  </View>
);

// ── Reveal Field (password) ───────────────────────────────────────
const RevealRow = ({ label, value, colors, accentColor }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.infoRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
        <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]}>
          {value ? (visible ? value : '••••••••••') : '—'}
        </Text>
        {value && (
          <TouchableOpacity
            onPress={() => setVisible(v => !v)}
            style={[{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' }]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {visible ? <EyeOff size={13} color={colors.textMuted} /> : <Eye size={13} color={colors.textMuted} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────
const SubscriptionDetailScreen = ({ route, navigation }) => {
  const { subscription: routeSub } = route.params || {};
  const theme = useAppStore(s => s.theme);
  const isConnected = useAppStore(s => s.isConnected);
  const accentColor = useAccentColor();
  const backendUrl = useAppStore(s => s.backendUrl);
  const user = useAppStore(s => s.user);
  const showToast = useAppStore(s => s.showToast);
  const colors = getColors(theme, accentColor, isConnected);
  const isWriteAllowed = user?.role !== ROLES.USER;

  const [sub, setSub] = useState(routeSub || null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [logoErr, setLogoErr] = useState(false);

  const id = routeSub?.id || routeSub?._id;

  useEffect(() => {
    Promise.all([
      subscriptionsApi.get(id),
      getCached(CK.EMPLOYEES),
    ]).then(([subRes, emps]) => {
      setSub(subRes.data);
      setEmployees(Array.isArray(emps) ? emps : []);
    }).catch(() => {
      showToast('Failed to load subscription', 'error');
      navigation.goBack();
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Subscription', `Delete "${sub.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await subscriptionsApi.delete(id);
            await invalidate(CK.SUBSCRIPTIONS, CK.DASHBOARD);
            showToast('Subscription deleted', 'success');
            navigation.goBack();
          } catch { showToast('Failed to delete', 'error'); setDeleting(false); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (!sub) return null;

  const expired = isExpired(sub.renewalDate);
  const expiring = isExpiringSoon(sub.renewalDate);
  const days = daysUntil(sub.renewalDate);
  const statusColor = expired ? '#ef4444' : expiring ? '#f59e0b' : '#22c55e';
  const statusLabel = expired ? 'Expired' : expiring ? 'Expiring Soon' : 'Active';
  const StatusIcon = expired ? AlertTriangle : expiring ? AlertTriangle : CheckCircle2;
  const logoUrl = sub.logoFileId ? getFileUrl(backendUrl, sub.logoFileId) : null;

  const assignedIds = sub.assignedEmployeeIds || (sub.assignedEmployeeId ? [sub.assignedEmployeeId] : []);
  const assignedEmployees = employees.filter(e => assignedIds.includes(e.id || e._id));

  const link = sub.link ? (sub.link.startsWith('http') ? sub.link : 'https://' + sub.link) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <FadeIn delay={0}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.bold }]} numberOfLines={1}>{sub.name}</Text>
          {isWriteAllowed && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AddSubscription', { editItem: sub })}
              >
                <Edit2 size={15} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)' }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? <ActivityIndicator size="small" color="#ef4444" /> : <Trash2 size={15} color="#ef4444" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </FadeIn>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Card ── */}
        <FadeIn delay={40}>
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient
              colors={[`${accentColor}22`, `${accentColor}00`]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroTop}>
              {/* Logo or icon */}
              {logoUrl && !logoErr ? (
                <View style={styles.heroLogoWrap}>
                  <Image source={{ uri: logoUrl }} style={{ width: 56, height: 56 }} resizeMode="contain" onError={() => setLogoErr(true)} />
                </View>
              ) : (
                <View style={[styles.heroLogoWrap, { backgroundColor: `${accentColor}18` }]}>
                  <CreditCard size={28} color={accentColor} />
                </View>
              )}
              {/* Status badge */}
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}14`, borderColor: `${statusColor}30` }]}>
                <StatusIcon size={11} color={statusColor} />
                <Text style={[{ fontSize: 12, color: statusColor, fontFamily: FONTS.semiBold }]}>{statusLabel}</Text>
              </View>
            </View>
            <Text style={[styles.heroName, { color: colors.text, fontFamily: FONTS.bold }]}>{sub.name}</Text>
            <View style={styles.heroChips}>
              {sub.price && (
                <View style={[styles.heroChip, { backgroundColor: `${accentColor}14` }]}>
                  <Text style={[{ fontSize: 14, color: accentColor, fontFamily: FONTS.bold }]}>
                    {formatCurrency(sub.price, sub.currency)}
                  </Text>
                  {sub.billingCycle && (
                    <Text style={[{ fontSize: 11, color: accentColor, fontFamily: FONTS.regular }]}> {sub.billingCycle}</Text>
                  )}
                </View>
              )}
              {sub.department && (
                <View style={[styles.heroChip, { backgroundColor: colors.inputBg }]}>
                  <Building2 size={11} color={colors.textMuted} />
                  <Text style={[{ fontSize: 12, color: colors.textMuted, fontFamily: FONTS.regular }]}>{sub.department}</Text>
                </View>
              )}
              {days !== null && (
                <View style={[styles.heroChip, { backgroundColor: `${statusColor}12` }]}>
                  <Calendar size={11} color={statusColor} />
                  <Text style={[{ fontSize: 12, color: statusColor, fontFamily: FONTS.semiBold }]}>
                    {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d left`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </FadeIn>

        {/* ── Subscription Details ── */}
        <SectionCard title="Subscription Details" icon={CreditCard} accentColor={accentColor} colors={colors} delay={80}>
          <InfoRow label="Name" value={sub.name} colors={colors} />
          <InfoRow label="Department" value={sub.department} colors={colors} />
          <InfoRow label="Billing Cycle" value={sub.billingCycle} colors={colors} />
          <InfoRow label="Payment Method" value={sub.paymentMethod} colors={colors} />
          <InfoRow label="Auto Pay" value={sub.autopay === 'auto' ? 'Enabled' : 'Manual'} colors={colors} />
          {sub.notes && <InfoRow label="Notes" value={sub.notes} colors={colors} last />}
        </SectionCard>

        {/* ── Pricing ── */}
        <SectionCard title="Pricing" icon={DollarSign} accentColor={accentColor} colors={colors} delay={120}>
          <View style={{ gap: 4, paddingVertical: 4 }}>
            <Text style={[{ fontSize: 28, color: accentColor, fontFamily: FONTS.bold }]}>
              {formatCurrency(sub.price, sub.currency)}
            </Text>
            <Text style={[{ fontSize: 13, color: colors.textMuted, fontFamily: FONTS.regular }]}>{sub.billingCycle}</Text>
          </View>
          {sub.price && sub.billingCycle === 'per month' && (
            <InfoRow label="Est. Yearly" value={formatCurrency(parseFloat(sub.price) * 12, sub.currency)} colors={colors} last />
          )}
          {sub.price && sub.billingCycle === 'per year' && (
            <InfoRow label="Est. Monthly" value={formatCurrency(parseFloat(sub.price) / 12, sub.currency)} colors={colors} last />
          )}
        </SectionCard>

        {/* ── Login Credentials ── */}
        <SectionCard title="Login Credentials" icon={Lock} accentColor={accentColor} colors={colors} delay={160}>
          <InfoRow label="Username" value={sub.username} colors={colors} />
          <RevealRow label="Password" value={sub.password} colors={colors} accentColor={accentColor} />
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>Link</Text>
            {link ? (
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}
                onPress={() => Linking.openURL(link)}
                activeOpacity={0.7}
              >
                <Globe size={13} color={accentColor} />
                <Text style={[{ fontSize: 13, color: accentColor, fontFamily: FONTS.semiBold }]} numberOfLines={1}>{sub.link}</Text>
                <ExternalLink size={12} color={accentColor} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: FONTS.semiBold }]}>—</Text>
            )}
          </View>
        </SectionCard>

        {/* ── Renewal ── */}
        <SectionCard title="Renewal" icon={Calendar} accentColor={accentColor} colors={colors} delay={200}>
          <View style={[styles.infoRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>Next Renewal</Text>
            <Text style={[styles.infoValue, { color: expired ? '#ef4444' : expiring ? '#f59e0b' : colors.text, fontFamily: FONTS.semiBold }]}>
              {formatDate(sub.renewalDate)}
            </Text>
          </View>
          {days !== null && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.infoLabel, { color: colors.textSubtle, fontFamily: FONTS.regular }]}>Status</Text>
              <Text style={[styles.infoValue, { color: statusColor, fontFamily: FONTS.semiBold }]}>
                {days < 0 ? `Expired ${Math.abs(days)} days ago` : days === 0 ? 'Expires today' : `${days} days remaining`}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Assigned Employees ── */}
        <SectionCard title="Assigned Employees" icon={Users} accentColor={accentColor} colors={colors} delay={240} badge={assignedEmployees.length || undefined}>
          {assignedEmployees.length === 0 ? (
            <View style={[{ padding: 20, alignItems: 'center', gap: 6 }]}>
              <Users size={20} color={colors.textSubtle} />
              <Text style={[{ fontSize: 13, color: colors.textMuted, fontFamily: FONTS.regular }]}>No employees assigned</Text>
            </View>
          ) : (
            assignedEmployees.map((emp, i) => (
              <TouchableOpacity
                key={emp.id || emp._id}
                style={[styles.empRow, { borderBottomColor: colors.border, borderBottomWidth: i < assignedEmployees.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
                onPress={() => navigation.navigate('EmployeeDetail', { employee: emp })}
                activeOpacity={0.8}
              >
                <View style={[styles.empAvatar, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={[{ fontSize: 13, fontFamily: FONTS.bold, color: accentColor }]}>{getInitials(emp.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 14, color: colors.text, fontFamily: FONTS.semiBold }]}>{emp.name}</Text>
                  <Text style={[{ fontSize: 12, color: colors.textMuted, fontFamily: FONTS.regular }]}>
                    {emp.employeeId}{emp.department ? ` · ${emp.department}` : ''}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textSubtle} />
              </TouchableOpacity>
            ))
          )}
        </SectionCard>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16 },
  scroll: { padding: 16, gap: 12, paddingBottom: 100 },

  // Hero
  heroCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 20, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heroLogoWrap: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  heroName: { fontSize: 22, lineHeight: 28, marginBottom: 14 },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },

  // Section
  sectionCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, flex: 1 },
  sectionBody: { paddingHorizontal: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 8 },
  infoLabel: { width: 110, fontSize: 12 },
  infoValue: { flex: 1, fontSize: 14, textAlign: 'right' },

  // Employee
  empRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  empAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});

export default SubscriptionDetailScreen;
