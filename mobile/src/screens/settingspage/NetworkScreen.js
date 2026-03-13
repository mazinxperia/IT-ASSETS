// settings/NetworkScreen.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { ChevronLeft, Wifi, WifiOff, Server, Bell } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, getColors } from '../../constants/theme';



const InfoRow = ({ icon: Icon, iconBg, iconColor, title, subtitle, right, last, c }) => (
  <>
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: c.text, fontFamily: FONTS.regular }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
    {!last && <View style={[styles.divider, { backgroundColor: c.border }]} />}
  </>
);

export default function NetworkScreen({ onClose }) {
  const theme                   = useAppStore(s => s.theme);
  const accentColor             = useAppStore(s => s.accentColor);
  const isConnected             = useAppStore(s => s.isConnected);
  const backendUrl              = useAppStore(s => s.backendUrl);
  const showConnectionBubble    = useAppStore(s => s.showConnectionBubble);
  const setShowConnectionBubble = useAppStore(s => s.setShowConnectionBubble);
  const c = getColors(theme, accentColor, isConnected);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: c.background }]}>
            <ChevronLeft size={22} color={c.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text, fontFamily: FONTS.bold }]}>Network</Text>
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: isConnected ? '#10b98118' : c.error + '18', borderColor: isConnected ? '#10b98140' : c.error + '40' }]}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : c.error }]} />
          <Text style={{ color: isConnected ? '#10b981' : c.error, fontFamily: FONTS.semiBold, fontSize: 15 }}>
            {isConnected ? 'Connected to backend' : 'Not connected'}
          </Text>
        </View>

        <View style={{ padding: 16 }}>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <InfoRow
              icon={isConnected ? Wifi : WifiOff}
              iconBg={isConnected ? '#10b981' : c.error} iconColor="#fff"
              title="Connection Status"
              subtitle={isConnected ? 'Backend is reachable' : 'Cannot reach backend'}
              c={c}
            />
            <InfoRow
              icon={Server} iconBg="#3b82f6" iconColor="#fff"
              title="Backend URL"
              subtitle={backendUrl || 'Not configured'}
              c={c}
            />
            <InfoRow
              icon={Bell} iconBg="#8b5cf6" iconColor="#fff"
              title="Reconnect Bubble"
              subtitle="Show floating bubble when disconnected"
              c={c} last
              right={<Switch value={showConnectionBubble} onValueChange={setShowConnectionBubble} color={accentColor} />}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1 },
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn:      { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:        { flex: 1, fontSize: 20 },
  statusBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  card:         { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, minHeight: 56, gap: 14 },
  rowIcon:      { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowBody:      { flex: 1 },
  rowTitle:     { fontSize: 15 },
  rowSub:       { fontSize: 12, marginTop: 1 },
  divider:      { height: StyleSheet.hairlineWidth, marginLeft: 66 },
});
