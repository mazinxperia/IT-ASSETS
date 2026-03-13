import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import useAppStore from '../../../store/useAppStore';
import { ACCENT_LIST } from '../../../constants/theme';

const NAVY = 'rgb(21, 32, 54)';
const SWATCH = 58;

const AccentScene = ({ animController, window }) => {
  const accentColor = useAppStore((s) => s.accentColor);
  const setAccentColor = useAppStore((s) => s.setAccentColor);
  const slideX = animController.current.interpolate({
    inputRange: [0, 0.6, 0.8, 1.0],
    outputRange: [window.width, window.width, 0, -window.width],
  });
  const titleX = animController.current.interpolate({
    inputRange: [0, 0.6, 0.8, 1.0],
    outputRange: [window.width * 2, window.width * 2, 0, -window.width * 2],
  });
  const bodyOpacity = animController.current.interpolate({
    inputRange: [0.7, 0.8, 0.95, 1.0],
    outputRange: [0, 1, 1, 0],
  });
  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideX }] }]}>
      <Animated.Text style={[styles.label, { transform: [{ translateX: titleX }] }]}>PERSONALIZE</Animated.Text>
      <Animated.Text style={[styles.heading, { transform: [{ translateX: titleX }] }]}>Pick your{'\n'}accent color.</Animated.Text>
      <Animated.View style={{ opacity: bodyOpacity }}>
        <Text style={styles.sub}>Used for buttons, highlights, and active states.</Text>
        <View style={[styles.preview, { borderColor: `${accentColor}40` }]}>
          <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
          <View style={styles.previewLines}>
            <View style={[styles.previewLine, { backgroundColor: accentColor, width: '80%' }]} />
            <View style={[styles.previewLine, { backgroundColor: accentColor, width: '55%', opacity: 0.4 }]} />
          </View>
          <View style={[styles.previewBtn, { backgroundColor: accentColor }]}>
            <Text style={styles.previewBtnText}>Active</Text>
          </View>
        </View>
        <View style={styles.grid}>
          {ACCENT_LIST.map((item) => (
            <TouchableOpacity key={item.key} onPress={async () => { await Haptics.selectionAsync(); setAccentColor(item.hex); }} style={styles.swatchWrapper} testID={`accent-swatch-${item.key}`}>
              <View style={[styles.swatch, { backgroundColor: item.hex }, accentColor === item.hex && styles.swatchSelected]}>
                {accentColor === item.hex && <Check size={16} color="#FFF" />}
              </View>
              <Text style={styles.swatchLabel}>{item.label}</Text>
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
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.5)', marginBottom: 20 },
  preview: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(21,32,54,0.04)', borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 28, gap: 12 },
  previewDot: { width: 28, height: 28, borderRadius: 14 },
  previewLines: { flex: 1 },
  previewLine: { height: 7, borderRadius: 4, marginBottom: 6 },
  previewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  previewBtnText: { color: '#FFF', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  swatchWrapper: { width: '22%', alignItems: 'center', marginBottom: 16 },
  swatch: { width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2, alignItems: 'center', justifyContent: 'center' },
  swatchSelected: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  swatchLabel: { marginTop: 6, fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.5)', textAlign: 'center' },
});

export default AccentScene;
