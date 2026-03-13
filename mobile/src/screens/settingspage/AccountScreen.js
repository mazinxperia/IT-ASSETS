// settings/AccountScreen.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Animated } from 'react-native';
import { useRef, useState } from 'react';
import AppAlert from '../../components/AppAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, LogOut, Trash2 } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, getColors } from '../../constants/theme';



const DangerRow = ({ icon: Icon, title, subtitle, onPress, last, c }) => (
  <>
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: c.errorContainer }]}>
        <Icon size={18} color={c.error} strokeWidth={2.2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: c.error, fontFamily: FONTS.regular }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
    {!last && <View style={[styles.divider, { backgroundColor: c.border }]} />}
  </>
);

export default function AccountScreen({ onClose }) {
  const theme              = useAppStore(s => s.theme);
  const accentColor        = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const user               = useAppStore(s => s.user);
  const logout             = useAppStore(s => s.logout);
  const setOnboardingComplete = useAppStore(s => s.setOnboardingComplete);
  const setBackendUrl      = useAppStore(s => s.setBackendUrl);
  const setIsConnected     = useAppStore(s => s.setIsConnected);
  const c = getColors(theme, accentColor, isConnected);
  const [alert, setAlert] = useState(null);
  const showAlert = (title, message, buttons) => setAlert({ title, message, buttons });
  const hideAlert = () => setAlert(null);

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () =>
    showAlert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel', onPress: hideAlert },
      { text: 'Log Out', style: 'destructive', onPress: () => { hideAlert(); logout(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);

  const handleReset = () =>
    showAlert('Reset App', 'This will clear all data and return to onboarding.', [
      { text: 'Cancel', style: 'cancel', onPress: hideAlert },
      { text: 'Reset', style: 'destructive', onPress: () => { hideAlert(); logout(); setBackendUrl(null); setIsConnected(false); setOnboardingComplete(false); } },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: c.background }]}>
            <ChevronLeft size={22} color={c.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text, fontFamily: FONTS.bold }]}>Account</Text>
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          {/* Profile info */}
          <View style={[styles.profileCard, { backgroundColor: accentColor + '18', borderColor: accentColor + '30' }]}>
            <View style={[styles.avatar, { backgroundColor: accentColor }]}>
              <Text style={{ color: '#fff', fontFamily: FONTS.bold, fontSize: 22 }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ color: c.text, fontFamily: FONTS.bold, fontSize: 17 }}>{user?.name || 'User'}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{user?.email || ''}</Text>
              <View style={[styles.rolePill, { backgroundColor: accentColor + '25' }]}>
                <Text style={{ color: accentColor, fontFamily: FONTS.semiBold, fontSize: 11 }}>
                  {(user?.role || 'user').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Danger zone */}
          <Text style={[styles.sectionLabel, { color: c.error }]}>DANGER ZONE</Text>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <DangerRow icon={LogOut} title="Log Out" subtitle="Sign out of your account" onPress={handleLogout} c={c} />
            <DangerRow icon={Trash2} title="Reset App" subtitle="Clear all data, return to onboarding" onPress={handleReset} last c={c} />
          </View>
        </View>
      </SafeAreaView>
    {alert && <AppAlert visible={!!alert} title={alert.title} message={alert.message} buttons={alert.buttons} colors={c} accentColor={accentColor} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:       { flex: 1, fontSize: 20 },
  profileCard: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1 },
  avatar:      { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  rolePill:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  sectionLabel:{ fontSize: 11, letterSpacing: 1.4, marginTop: 4 },
  card:        { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, minHeight: 56, gap: 14 },
  rowIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowBody:     { flex: 1 },
  rowTitle:    { fontSize: 15 },
  rowSub:      { fontSize: 12, marginTop: 1 },
  divider:     { height: StyleSheet.hairlineWidth, marginLeft: 66 },
});
