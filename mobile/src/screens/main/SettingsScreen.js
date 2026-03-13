import React, { useRef } from 'react';
import {
  View, ScrollView, StyleSheet, Animated,
  Pressable, Switch, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import {
  Sun, Moon, Palette, Wifi,
  ChevronRight, Layers, Users, Shield,
} from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, ACCENT_LIST, getColors } from '../../constants/theme';
import SlideModal from '../../components/SlideModal';
import AccentColorPickerScreen from '../settingspage/AccentColorPickerScreen';
import AssetTypesScreen        from '../settingspage/AssetTypesScreen';
import EmployeeFieldsScreen    from '../settingspage/EmployeeFieldsScreen';
import NetworkScreen           from '../settingspage/NetworkScreen';
import AccountScreen           from '../settingspage/AccountScreen';

const getIconColor = (hex) => {
  try {
    const c = (hex || '').replace('#', '');
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    return lum > 0.5 ? '#111111' : '#ffffff';
  } catch { return '#ffffff'; }
};

const SectionLabel = ({ label, accent }) => (
  <Text style={[styles.sectionLabel, { color: accent, fontFamily: FONTS.semiBold }]}>
    {label.toUpperCase()}
  </Text>
);

const Card = ({ children, c }) => (
  <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
    {children}
  </View>
);

const Row = ({ icon: Icon, iconBg, iconColor, title, subtitle, right, onPress, last, c, destructive }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const row = (
    <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? c.error + '18' : iconBg }]}>
        <Icon size={18} color={destructive ? c.error : iconColor} strokeWidth={2.2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: destructive ? c.error : c.text, fontFamily: FONTS.regular }]}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.rowSub, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right
        : onPress ? <ChevronRight size={16} color={c.textMuted} strokeWidth={2} /> : null}
    </Animated.View>
  );
  return (
    <>
      {onPress ? (
        <Pressable
          onPress={onPress}
          onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
          android_ripple={{ color: c.border }}
        >{row}</Pressable>
      ) : row}
      {!last && <View style={[styles.divider, { backgroundColor: c.border }]} />}
    </>
  );
};

const SettingsScreen = ({ tabIndex = 3 }) => {
  const theme       = useAppStore(s => s.theme);
  const accentColor = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const user        = useAppStore(s => s.user);

  const c          = getColors(theme, accentColor, isConnected);
  const initials   = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const accentName = ACCENT_LIST?.find(a => a.hex === accentColor)?.label || 'Custom';

  const [modal, setModal] = React.useState(null);
  const open  = (key) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModal(key); };
  const close = () => setModal(null);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modal) { close(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [modal]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={[]}>
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <Text style={[styles.pageTitle, { color: c.text, fontFamily: FONTS.bold }]}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: accentColor + '18', borderColor: accentColor + '30' }]}>
          <View style={[styles.avatar, { backgroundColor: accentColor }]}>
            <Text style={{ color: getIconColor(accentColor), fontFamily: FONTS.bold, fontSize: 22 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: c.text, fontFamily: FONTS.bold }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.profileEmail, { color: c.textMuted }]}>{user?.email || ''}</Text>
            <View style={[styles.rolePill, { backgroundColor: accentColor + '25' }]}>
              <Text style={{ color: accentColor, fontFamily: FONTS.semiBold, fontSize: 11 }}>
                {(user?.role || 'user').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <SectionLabel label="Display" accent={accentColor} />
        <Card c={c}>
          <Row
            icon={theme === 'dark' ? Moon : Sun}
            iconBg={theme === 'dark' ? '#6366f1' : '#f59e0b'}
            iconColor="#fff"
            title="Dark Mode"
            subtitle={theme === 'dark' ? 'Using dark theme' : 'Using light theme'}
            c={c}
            right={<Switch value={theme === 'dark'} onValueChange={async () => { await Haptics.selectionAsync(); toggleTheme(); }} color={accentColor} />}
          />
          <Row
            icon={Palette} iconBg={accentColor} iconColor={getIconColor(accentColor)}
            title="Accent Color" subtitle={accentName}
            c={c} last onPress={() => open('accent')}
          />
        </Card>

        <SectionLabel label="Configuration" accent={accentColor} />
        <Card c={c}>
          <Row
            icon={Layers} iconBg="#8b5cf6" iconColor="#fff"
            title="Asset Types" subtitle="Manage types and custom fields"
            c={c} onPress={() => open('assets')}
          />
          <Row
            icon={Users} iconBg="#3b82f6" iconColor="#fff"
            title="Employee Fields" subtitle="Customize employee profiles"
            c={c} last onPress={() => open('employees')}
          />
        </Card>

        <SectionLabel label="System" accent={accentColor} />
        <Card c={c}>
          <Row
            icon={Wifi}
            iconBg="#10b981" iconColor="#fff"
            title="Network" subtitle="Backend status"
            c={c} onPress={() => open('network')}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.statusPill, { backgroundColor: isConnected ? '#10b98120' : c.error + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : c.error }]} />
                  <Text style={{ color: isConnected ? '#10b981' : c.error, fontFamily: FONTS.semiBold, fontSize: 12 }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
                <ChevronRight size={16} color={c.textMuted} strokeWidth={2} />
              </View>
            }
          />
          <Row
            icon={Shield} iconBg="#ef4444" iconColor="#fff"
            title="Account" subtitle="Log out or reset app"
            c={c} last onPress={() => open('account')}
          />
        </Card>

        <Text style={[styles.version, { color: c.textMuted }]}>AssetFlow v1.0.0</Text>
        <View style={{ height: 120 }} />
      </ScrollView>

      <SlideModal visible={modal === 'accent'}    onClose={close}><AccentColorPickerScreen onClose={close} /></SlideModal>
      <SlideModal visible={modal === 'assets'}    onClose={close}><AssetTypesScreen onClose={close} /></SlideModal>
      <SlideModal visible={modal === 'employees'} onClose={close}><EmployeeFieldsScreen onClose={close} /></SlideModal>
      <SlideModal visible={modal === 'network'}   onClose={close}><NetworkScreen onClose={close} /></SlideModal>
      <SlideModal visible={modal === 'account'}   onClose={close}><AccountScreen onClose={close} /></SlideModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  topBar:    { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  pageTitle: { fontSize: 34, letterSpacing: -0.5 },
  content:   { paddingBottom: 40 },
  profileCard:  { marginHorizontal: 16, marginTop: 8, marginBottom: 4, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1 },
  avatar:       { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  profileName:  { fontSize: 18, marginBottom: 2 },
  profileEmail: { fontSize: 13 },
  rolePill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  sectionLabel: { paddingHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 11, letterSpacing: 1.4 },
  card:         { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, minHeight: 56, gap: 14 },
  rowIcon:      { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowBody:      { flex: 1 },
  rowTitle:     { fontSize: 15 },
  rowSub:       { fontSize: 12, marginTop: 1 },
  divider:      { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  version:      { textAlign: 'center', marginTop: 28, fontSize: 12 },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
});

export default SettingsScreen;
