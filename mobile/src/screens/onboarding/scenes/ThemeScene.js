import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import useAppStore from '../../../store/useAppStore';

const NAVY = 'rgb(21, 32, 54)';
const { width } = Dimensions.get('window');
const CARD_W = (width - 80) / 2;

const ThemeScene = ({ animController, window }) => {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const setTheme = useAppStore((s) => s.setTheme);
  const slideX = animController.current.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8, 1.0],
    outputRange: [window.width, window.width, 0, -window.width, -window.width],
  });
  const titleX = animController.current.interpolate({
    inputRange: [0, 0.4, 0.6, 0.8, 1.0],
    outputRange: [window.width * 2, window.width * 2, 0, -window.width * 2, -window.width * 2],
  });
  const bodyOpacity = animController.current.interpolate({
    inputRange: [0.5, 0.6, 0.75, 0.8],
    outputRange: [0, 1, 1, 0],
  });
  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideX }] }]}>
      <Animated.Text style={[styles.label, { transform: [{ translateX: titleX }] }]}>PERSONALIZE</Animated.Text>
      <Animated.Text style={[styles.heading, { transform: [{ translateX: titleX }] }]}>
        Choose your{'\n'}look.
      </Animated.Text>
      <Animated.View style={{ opacity: bodyOpacity }}>
        <Text style={styles.sub}>This can be changed anytime in Settings.</Text>
        <View style={styles.cardsRow}>
          {[{ key: 'dark', label: 'Dark', desc: 'Easy on the eyes' }, { key: 'light', label: 'Light', desc: 'Clean & bright' }].map((t) => (
            <TouchableOpacity key={t.key} onPress={async () => { await Haptics.selectionAsync(); setTheme(t.key); }} activeOpacity={0.85} testID={`theme-card-${t.key}`}>
              <View style={[styles.card, theme === t.key && { borderColor: accentColor, borderWidth: 2 }]}>
                <View style={[styles.cardInner, { backgroundColor: t.key === 'dark' ? '#0a0a0f' : '#F5F5F7' }]}>
                  <View style={[styles.miniHeader, { backgroundColor: t.key === 'dark' ? '#16161e' : '#FFFFFF' }]}>
                    <View style={[styles.miniDot, { backgroundColor: accentColor }]} />
                    <View style={[styles.miniLine, { backgroundColor: t.key === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', width: '45%' }]} />
                  </View>
                  <View style={{ padding: 8 }}>
                    {[1, 2].map((n) => (
                      <View key={n} style={[styles.miniCard, { backgroundColor: t.key === 'dark' ? '#16161e' : '#FFFFFF', marginBottom: n === 1 ? 6 : 0 }]}>
                        <View style={[styles.miniLine, { backgroundColor: t.key === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', width: '70%' }]} />
                        <View style={[styles.miniLine, { backgroundColor: t.key === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', width: '50%', marginTop: 4 }]} />
                      </View>
                    ))}
                  </View>
                </View>
                {theme === t.key && <View style={[styles.checkBadge, { backgroundColor: accentColor }]}><Check size={11} color="#FFF" /></View>}
              </View>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardDesc}>{t.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingHorizontal: 32, paddingBottom: 140, justifyContent: 'center' },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(21,32,54,0.35)', letterSpacing: 3, marginBottom: 12 },
  heading: { fontSize: 40, fontFamily: 'Inter_700Bold', color: NAVY, lineHeight: 48, marginBottom: 12 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.5)', marginBottom: 28 },
  cardsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { width: CARD_W, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  cardInner: { borderRadius: 14, overflow: 'hidden' },
  miniHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
  miniDot: { width: 10, height: 10, borderRadius: 5 },
  miniLine: { height: 6, borderRadius: 3 },
  miniCard: { borderRadius: 8, padding: 8 },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { marginTop: 10, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: NAVY, textAlign: 'center' },
  cardDesc: { marginTop: 2, fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.4)', textAlign: 'center' },
});

export default ThemeScene;
