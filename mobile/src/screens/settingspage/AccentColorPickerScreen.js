// ============================================================
// AccentColorPickerScreen — Full rewrite
// Swatches + HSV Picker + Hex Input + Live Preview
// No restrictions. Full freedom.
// ============================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, PanResponder, TextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Package, ChevronLeft, Check, Hash } from 'lucide-react-native';
import useAppStore from '../../store/useAppStore';
import { FONTS, getColors } from '../../constants/theme';

const { width } = Dimensions.get('window');
const PAD         = 16;
const PICKER_W    = width - PAD * 4;
const PICKER_H    = 220;
const HUE_H       = 26;
const THUMB       = 26;
const SWATCH_SIZE = (width - 32 - 6 * 8) / 7;

// ─── Color utilities ─────────────────────────────────────────
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

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const k = n => (n + h / 60) % 6;
  const f = n => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, v = max;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(v * 100)];
}

function hexFromHsv(h, s, v) {
  return rgbToHex(...hsvToRgb(h, s, v));
}

// ─── Palette ─────────────────────────────────────────────────
const PALETTE = [
  { hex: '#ef4444', label: 'Red' },     { hex: '#f43f5e', label: 'Rose' },
  { hex: '#ec4899', label: 'Pink' },    { hex: '#e879a0', label: 'Flamingo' },
  { hex: '#fb7185', label: 'Blush' },   { hex: '#f97316', label: 'Orange' },
  { hex: '#fb923c', label: 'Peach' },   { hex: '#f59e0b', label: 'Amber' },
  { hex: '#fbbf24', label: 'Yellow' },  { hex: '#eab308', label: 'Gold' },
  { hex: '#84cc16', label: 'Lime' },    { hex: '#22c55e', label: 'Green' },
  { hex: '#10b981', label: 'Emerald' }, { hex: '#14b8a6', label: 'Teal' },
  { hex: '#2dd4bf', label: 'Mint' },    { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#0ea5e9', label: 'Sky' },     { hex: '#3b82f6', label: 'Blue' },
  { hex: '#6366f1', label: 'Indigo' },  { hex: '#4f46e5', label: 'Royal' },
  { hex: '#8b5cf6', label: 'Violet' },  { hex: '#a855f7', label: 'Purple' },
  { hex: '#d946ef', label: 'Fuchsia' }, { hex: '#c026d3', label: 'Magenta' },
  { hex: '#7c3aed', label: 'Grape' },   { hex: '#0891b2', label: 'Ocean' },
  { hex: '#0d9488', label: 'Forest' },  { hex: '#059669', label: 'Jade' },
  { hex: '#16a34a', label: 'Moss' },    { hex: '#65a30d', label: 'Olive' },
  { hex: '#dc2626', label: 'Crimson' }, { hex: '#b45309', label: 'Brown' },
  { hex: '#92400e', label: 'Caramel' }, { hex: '#78716c', label: 'Slate' },
  { hex: '#64748b', label: 'Steel' },   { hex: '#1d4ed8', label: 'Cobalt' },
  { hex: '#7e22ce', label: 'Plum' },    { hex: '#be185d', label: 'Berry' },
  { hex: '#0f766e', label: 'Pine' },    { hex: '#0369a1', label: 'Denim' },
  { hex: '#000000', label: 'Black' },   { hex: '#ffffff', label: 'White' },
];

// ─── Live Preview ─────────────────────────────────────────────
const LivePreview = ({ accent, surface, text, muted }) => (
  <View style={[pv.wrap, { backgroundColor: surface }]}>
    <Text style={[pv.label, { color: accent, fontFamily: FONTS.semiBold }]}>PREVIEW</Text>
    <View style={[pv.btn, { backgroundColor: accent }]}>
      <Text style={{ color: getIconColor(accent), fontFamily: FONTS.bold, fontSize: 15 }}>Apply Color</Text>
    </View>
    <View style={pv.row}>
      {[['37', 'Employees'], ['139', 'Assets']].map(([v, l]) => (
        <View key={l} style={[pv.card, { borderColor: accent + '40' }]}>
          <View style={[pv.icon, { backgroundColor: accent + '22' }]}>
            <Package size={14} color={accent} strokeWidth={2.2} />
          </View>
          <Text style={[pv.val, { color: accent, fontFamily: FONTS.bold }]}>{v}</Text>
          <Text style={[pv.lbl, { color: muted }]}>{l}</Text>
        </View>
      ))}
    </View>
    <View style={[pv.hexRow, { backgroundColor: accent + '15', borderColor: accent + '35' }]}>
      <View style={[pv.dot, { backgroundColor: accent }]} />
      <Text style={[pv.hexTxt, { color: text, fontFamily: FONTS.semiBold }]}>{accent.toUpperCase()}</Text>
    </View>
  </View>
);

const pv = StyleSheet.create({
  wrap:   { borderRadius: 20, padding: 18, marginHorizontal: PAD, marginTop: 8 },
  label:  { fontSize: 11, letterSpacing: 1.4, marginBottom: 14 },
  btn:    { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  row:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  card:   { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5 },
  icon:   { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  val:    { fontSize: 20, lineHeight: 24 },
  lbl:    { fontSize: 11, marginTop: 2 },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1 },
  dot:    { width: 22, height: 22, borderRadius: 11 },
  hexTxt: { fontSize: 15, flex: 1 },
});

// ─── HSV Picker ───────────────────────────────────────────────
const HSVPicker = ({ hue, sat, val, onSV, onHue }) => {
  const svBox  = useRef(null);
  const hueBox = useRef(null);

  const handleSV = useCallback((pageX, pageY) => {
    svBox.current?.measure((fx, fy, fw, fh, px, py) => {
      const s = Math.round(clamp((pageX - px) / fw, 0, 1) * 100);
      const v = Math.round(clamp(1 - (pageY - py) / fh, 0, 1) * 100);
      onSV(s, v);
    });
  }, [onSV]);

  const handleHue = useCallback((pageX) => {
    hueBox.current?.measure((fx, fy, fw, fh, px) => {
      const h = Math.round(clamp((pageX - px) / fw, 0, 0.9999) * 360);
      onHue(h);
    });
  }, [onHue]);

  const svPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: e => handleSV(e.nativeEvent.pageX, e.nativeEvent.pageY),
    onPanResponderMove:  e => handleSV(e.nativeEvent.pageX, e.nativeEvent.pageY),
  })).current;

  const huePan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: e => handleHue(e.nativeEvent.pageX),
    onPanResponderMove:  e => handleHue(e.nativeEvent.pageX),
  })).current;

  const pureHue = hexFromHsv(hue, 100, 100);
  const cx = clamp((sat / 100) * PICKER_W - THUMB / 2, -THUMB / 2, PICKER_W - THUMB / 2);
  const cy = clamp((1 - val / 100) * PICKER_H - THUMB / 2, -THUMB / 2, PICKER_H - THUMB / 2);
  const hx = clamp((hue / 360) * PICKER_W - THUMB / 2, -THUMB / 2, PICKER_W - THUMB / 2);

  return (
    <View style={hsv.wrap}>
      <View ref={svBox} style={hsv.svBox} {...svPan.panHandlers}>
        <LinearGradient
          colors={['#ffffff', pureHue]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', '#000000']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[hsv.svThumb, {
          left: cx, top: cy,
          borderColor: val > 55 ? '#00000099' : '#ffffffdd',
        }]} />
      </View>

      <View ref={hueBox} style={hsv.hueBar} {...huePan.panHandlers}>
        <LinearGradient
          colors={['#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ff0000']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 13 }]}
        />
        <View style={[hsv.hueThumb, { left: hx }]} />
      </View>
    </View>
  );
};

const hsv = StyleSheet.create({
  wrap:     { paddingHorizontal: PAD * 2, paddingBottom: 8, paddingTop: 4 },
  svBox:    { width: PICKER_W, height: PICKER_H, borderRadius: 14, overflow: 'hidden', marginBottom: 18, alignSelf: 'center' },
  svThumb:  { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2.5, backgroundColor: 'transparent', elevation: 4 },
  hueBar:   { width: PICKER_W, height: HUE_H, borderRadius: 13, alignSelf: 'center', marginBottom: 4 },
  hueThumb: { position: 'absolute', top: (HUE_H - THUMB) / 2, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: '#fff', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 5, elevation: 6 },
});

// ─── Main Screen ──────────────────────────────────────────────
export default function AccentColorPickerScreen({ navigation, onClose }) {
  const goBack         = () => { if (onClose) onClose(); else if (navigation?.goBack) navigation.goBack(); };
  const accentColor    = useAppStore(s => s.accentColor);
  const isConnected = useAppStore(s => s.isConnected);
  const setAccentColor = useAppStore(s => s.setAccentColor);
  const theme          = useAppStore(s => s.theme);
  const isDark         = theme === 'dark';

  const initRgb        = hexToRgb(accentColor) || [139, 92, 246];
  const [iH, iS, iV]   = rgbToHsv(...initRgb);

  const [tab, setTab]           = useState('swatches');
  const [selected, setSelected] = useState(accentColor);
  const [hue, setHue]           = useState(iH);
  const [sat, setSat]           = useState(iS);
  const [val, setVal]           = useState(iV);
  const [hexInput, setHexInput] = useState(accentColor.replace('#', '').toUpperCase());
  const [hexError, setHexError] = useState(false);

  const bg      = isDark ? '#141418' : '#f7f7fb';
  const surface = isDark ? '#1c1c22' : '#ffffff';
  const text    = isDark ? '#e4e4ef' : '#1a1a24';
  const muted   = isDark ? '#8888a0' : '#60607a';
  const outline = isDark ? '#2a2a35' : '#e0e0ec';

  const applyHex = useCallback((hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const [h, s, v] = rgbToHsv(...rgb);
    hueRef.current = h; satRef.current = s; valRef.current = v;
    setHue(h); setSat(s); setVal(v);
    setSelected(hex);
    setHexInput(hex.replace('#', '').toUpperCase());
    setHexError(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const hueRef = useRef(iH);
  const satRef = useRef(iS);
  const valRef = useRef(iV);

  const onSV = useCallback((s, v) => {
    satRef.current = s; valRef.current = v;
    setSat(s); setVal(v);
    const hex = hexFromHsv(hueRef.current, s, v);
    setSelected(hex);
    setHexInput(hex.replace('#', '').toUpperCase());
  }, []);

  const onHue = useCallback((h) => {
    hueRef.current = h;
    setHue(h);
    const hex = hexFromHsv(h, satRef.current, valRef.current);
    setSelected(hex);
    setHexInput(hex.replace('#', '').toUpperCase());
  }, []);

  const onHexChange = (txt) => {
    const clean = txt.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexInput(clean.toUpperCase());
    if (clean.length === 6) {
      const hex = '#' + clean.toLowerCase();
      const rgb = hexToRgb(hex);
      if (rgb) {
        setHexError(false);
        const [h, s, v] = rgbToHsv(...rgb);
        hueRef.current = h; satRef.current = s; valRef.current = v;
        setHue(h); setSat(s); setVal(v);
        setSelected(hex);
      } else {
        setHexError(true);
      }
    }
  };

  const confirm = () => {
    setAccentColor(selected);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goBack();
  };

  return (
    <View style={[st.root, { backgroundColor: bg }]}>
      <SafeAreaView style={st.safe}>

        {/* Header */}
        <View style={st.header}>
          <Pressable onPress={goBack} hitSlop={12} style={[st.backBtn, { backgroundColor: surface }]}>
            <ChevronLeft size={22} color={text} strokeWidth={2.2} />
          </Pressable>
          <Text style={[st.title, { color: text, fontFamily: FONTS.bold }]}>Accent Color</Text>
          <Pressable onPress={confirm} style={[st.applyBtn, { backgroundColor: selected }]}>
            <Text style={{ color: getIconColor(selected), fontFamily: FONTS.semiBold, fontSize: 14 }}>Apply</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={[st.tabBar, { backgroundColor: surface, borderColor: outline }]}>
          {[['swatches', 'Swatches'], ['full', 'Full Picker']].map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[st.tabBtn, key === tab && { backgroundColor: selected }]}
            >
              <Text style={[st.tabTxt, {
                color: key === tab ? getIconColor(selected) : muted,
                fontFamily: key === tab ? FONTS.semiBold : FONTS.regular,
              }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Live Preview */}
          <LivePreview accent={selected} surface={surface} text={text} muted={muted} />

          {/* ── Swatches tab ── */}
          {tab === 'swatches' && (
            <View style={[st.section, { backgroundColor: surface }]}>
              <Text style={[st.secLabel, { color: selected, fontFamily: FONTS.semiBold }]}>COLORS</Text>
              <View style={st.grid}>
                {PALETTE.map(item => {
                  const active = selected === item.hex;
                  return (
                    <Pressable key={item.hex} onPress={() => applyHex(item.hex)} style={st.swatchWrap}>
                      <View style={[
                        st.swatch,
                        { backgroundColor: item.hex },
                        active && st.swatchActive,
                        item.hex === '#ffffff' && { borderWidth: 1.5, borderColor: outline },
                      ]}>
                        {active && (
                          <Check size={16} color={item.hex === '#ffffff' ? '#333' : '#fff'} strokeWidth={3} />
                        )}
                      </View>
                      <Text style={[st.swatchLbl, { color: muted }]} numberOfLines={1}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Full Picker tab ── */}
          {tab === 'full' && (
            <View style={[st.section, { backgroundColor: surface }]}>
              <Text style={[st.secLabel, { color: selected, fontFamily: FONTS.semiBold }]}>PICK ANY COLOR</Text>
              <Text style={[st.hint, { color: muted }]}>
                Drag in the square to pick shade • Slide rainbow bar for hue
              </Text>

              <HSVPicker hue={hue} sat={sat} val={val} onSV={onSV} onHue={onHue} />

              {/* Result + hex input */}
              <View style={st.resultRow}>
                <View style={[st.resultSwatch, { backgroundColor: selected }]} />
                <View style={[st.hexWrap, {
                  backgroundColor: isDark ? '#0e0e14' : '#f0f0f8',
                  borderColor: hexError ? '#ef4444' : outline,
                }]}>
                  <Hash size={16} color={muted} strokeWidth={2} />
                  <TextInput
                    value={hexInput}
                    onChangeText={onHexChange}
                    onSubmitEditing={Keyboard.dismiss}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    placeholder="8B5CF6"
                    placeholderTextColor={muted}
                    style={[st.hexField, { color: text, fontFamily: FONTS.bold }]}
                  />
                </View>
              </View>
              {hexError && (
                <Text style={[st.errTxt, { fontFamily: FONTS.regular }]}>Invalid hex color</Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingVertical: 12,
  },
  backBtn:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 18, flex: 1, textAlign: 'center' },
  applyBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: PAD,
    borderRadius: 16, padding: 4, borderWidth: 1,
    marginBottom: 4, marginTop: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabTxt: { fontSize: 14 },

  section:  { marginHorizontal: PAD, borderRadius: 20, padding: 18, marginTop: 12 },
  secLabel: { fontSize: 11, letterSpacing: 1.4, marginBottom: 6 },
  hint:     { fontSize: 12, marginBottom: 14 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  swatchWrap:   { alignItems: 'center', width: SWATCH_SIZE },
  swatch:       { width: SWATCH_SIZE, height: SWATCH_SIZE, borderRadius: SWATCH_SIZE / 2, alignItems: 'center', justifyContent: 'center' },
  swatchActive: { borderWidth: 3, borderColor: '#fff', elevation: 6, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  swatchLbl:    { fontSize: 9, marginTop: 4, textAlign: 'center' },

  resultRow:    { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  resultSwatch: { width: 52, height: 52, borderRadius: 14 },
  hexWrap:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 52 },
  hexField:     { flex: 1, fontSize: 20, letterSpacing: 2 },
  errTxt:       { color: '#ef4444', fontSize: 12, marginTop: 6, marginLeft: PAD },
});
