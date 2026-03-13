// ============================================================
// AssetFlow — Material Design 3 Theme System
// Powered by @material/material-color-utilities
//
// install: npm install @material/material-color-utilities
//
// How it works:
//   buildM3Theme(accentHex, isDark) → full Paper-compatible theme
//   The entire palette (background, surface, primary, containers…)
//   is mathematically derived from the single accent (seed) color.
//   Change the accent → everything shifts harmoniously.
// ============================================================

import {
  argbFromHex,
  themeFromSourceColor,
  hexFromArgb,
} from '@material/material-color-utilities';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// ─── Core palette builder ─────────────────────────────────────
// Takes any hex color → returns a full Paper MD3 theme object
// ─── Sanitize seed color for M3 ──────────────────────────────
// M3 breaks with near-black, near-white, or grey seeds.
// We clamp to a safe HSV range so the palette always works.
const sanitizeSeed = (hex) => {
  try {
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min;
    let h=0, s = max===0?0:d/max, v=max;
    if(d!==0){
      if(max===r) h=((g-b)/d)%6;
      else if(max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h=Math.round(h*60); if(h<0)h+=360;
    }
    // Clamp: saturation min 35%, value 30-85%
    s = Math.max(0.35, s);
    v = Math.min(0.85, Math.max(0.30, v));
    const k=(n)=>(n+h/60)%6;
    const f=(n)=>v-v*s*Math.max(0,Math.min(k(n),4-k(n),1));
    const ro=Math.round(f(5)*255), go=Math.round(f(3)*255), bo=Math.round(f(1)*255);
    return '#'+[ro,go,bo].map(x=>x.toString(16).padStart(2,'0')).join('');
  } catch { return '#8B5CF6'; }
};

export const buildM3Theme = (accentHex = '#8B5CF6', isDark = false) => {
  // 1. Generate the full M3 scheme from the seed color
  const safeSeed = sanitizeSeed(accentHex);
  const { schemes, palettes } = themeFromSourceColor(argbFromHex(safeSeed));
  const scheme = isDark ? schemes.dark : schemes.light;

  // 2. Map M3 token names → hex strings
  const colors = {
    primary:              hexFromArgb(scheme.primary),
    onPrimary:            hexFromArgb(scheme.onPrimary),
    primaryContainer:     hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer:   hexFromArgb(scheme.onPrimaryContainer),

    secondary:            hexFromArgb(scheme.secondary),
    onSecondary:          hexFromArgb(scheme.onSecondary),
    secondaryContainer:   hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),

    tertiary:             hexFromArgb(scheme.tertiary),
    onTertiary:           hexFromArgb(scheme.onTertiary),
    tertiaryContainer:    hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer:  hexFromArgb(scheme.onTertiaryContainer),

    error:                hexFromArgb(scheme.error),
    onError:              hexFromArgb(scheme.onError),
    errorContainer:       hexFromArgb(scheme.errorContainer),
    onErrorContainer:     hexFromArgb(scheme.onErrorContainer),

    background:           hexFromArgb(scheme.background),
    onBackground:         hexFromArgb(scheme.onBackground),

    surface:              hexFromArgb(scheme.surface),
    onSurface:            hexFromArgb(scheme.onSurface),
    surfaceVariant:       hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant:     hexFromArgb(scheme.onSurfaceVariant),

    outline:              hexFromArgb(scheme.outline),
    outlineVariant:       hexFromArgb(scheme.outlineVariant),

    shadow:               hexFromArgb(scheme.shadow),
    scrim:                hexFromArgb(scheme.scrim),

    inverseSurface:       hexFromArgb(scheme.inverseSurface),
    inverseOnSurface:     hexFromArgb(scheme.inverseOnSurface),
    inversePrimary:       hexFromArgb(scheme.inversePrimary),

    // Surface container roles (M3 2023 spec additions)
    // Derived from the neutral palette tones
    surfaceDim:               hexFromArgb(palettes.neutral.tone(isDark ? 6  : 87)),
    surfaceBright:            hexFromArgb(palettes.neutral.tone(isDark ? 24 : 98)),
    surfaceContainerLowest:   hexFromArgb(palettes.neutral.tone(isDark ? 4  : 100)),
    surfaceContainerLow:      hexFromArgb(palettes.neutral.tone(isDark ? 10 : 96)),
    surfaceContainer:         hexFromArgb(palettes.neutral.tone(isDark ? 12 : 94)),
    surfaceContainerHigh:     hexFromArgb(palettes.neutral.tone(isDark ? 17 : 92)),
    surfaceContainerHighest:  hexFromArgb(palettes.neutral.tone(isDark ? 22 : 90)),

    // Elevation tint (primary color at M3 specified opacities)
    elevation: {
      level0: 'transparent',
      level1: `${hexFromArgb(scheme.primary)}0D`,  // 5%
      level2: `${hexFromArgb(scheme.primary)}14`,  // 8%
      level3: `${hexFromArgb(scheme.primary)}1C`,  // 11%
      level4: `${hexFromArgb(scheme.primary)}1F`,  // 12%
      level5: `${hexFromArgb(scheme.primary)}24`,  // 14%
    },

    // Legacy compat — your existing screens use colors.accent
    accent:       accentHex,  // use raw user color for UI elements
    accentLight:  `${hexFromArgb(scheme.primary)}20`,
    accentMedium: `${hexFromArgb(scheme.primary)}40`,

    // Status colors — harmonized with the scheme
    success:      hexFromArgb(palettes.tertiary.tone(isDark ? 80 : 40)),
    successLight: `${hexFromArgb(palettes.tertiary.tone(isDark ? 80 : 40))}20`,
    warning:      '#F59E0B',
    warningLight: '#F59E0B20',

    // Flags
    isDark,
    isGrayscale: false,

    text:         hexFromArgb(scheme.onBackground),
    textMuted:    hexFromArgb(scheme.onSurfaceVariant),
    textSubtle:   hexFromArgb(palettes.neutralVariant.tone(isDark ? 40 : 60)),
    card:         hexFromArgb(palettes.neutral.tone(isDark ? 12 : 94)),
    cardElevated: hexFromArgb(palettes.neutral.tone(isDark ? 17 : 92)),
    border:       hexFromArgb(scheme.outlineVariant),
    inputBg:      hexFromArgb(palettes.neutral.tone(isDark ? 17 : 92)),
    inputBorder:  hexFromArgb(scheme.outline),
    navBg:        isDark ? '#1a1a1a' : '#f0f0f0',
    overlay:      isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    statusActive:  hexFromArgb(palettes.tertiary.tone(isDark ? 80 : 40)),
    statusRepair:  '#F59E0B',
    statusRetired: hexFromArgb(scheme.error),
  };

  // 3. Merge into Paper's base theme
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...colors,
    },
    // Expose raw scheme for advanced use
    _scheme: scheme,
    _palettes: palettes,
  };
};

// ─── Grayscale theme (disconnected state) ─────────────────────
export const buildGrayscaleTheme = () => {
  const base = MD3DarkTheme;
  const colors = {
    primary:              '#9E9E9E',
    onPrimary:            '#1A1A1A',
    primaryContainer:     '#3D3D3D',
    onPrimaryContainer:   '#E0E0E0',
    secondary:            '#757575',
    onSecondary:          '#121212',
    secondaryContainer:   '#2E2E2E',
    onSecondaryContainer: '#BDBDBD',
    tertiary:             '#9E9E9E',
    onTertiary:           '#1A1A1A',
    tertiaryContainer:    '#3D3D3D',
    onTertiaryContainer:  '#E0E0E0',
    error:                '#CF6679',
    onError:              '#1A0008',
    errorContainer:       '#93000A',
    onErrorContainer:     '#FFB4AB',
    background:           '#121212',
    onBackground:         '#E3E3E3',
    surface:              '#121212',
    onSurface:            '#E3E3E3',
    surfaceVariant:       '#2C2C2C',
    onSurfaceVariant:     '#ABABAB',
    outline:              '#737373',
    outlineVariant:       '#3A3A3A',
    shadow:               '#000000',
    scrim:                '#000000',
    inverseSurface:       '#E3E3E3',
    inverseOnSurface:     '#2C2C2C',
    inversePrimary:       '#5C5C5C',
    surfaceDim:           '#0A0A0A',
    surfaceBright:        '#303030',
    surfaceContainerLowest:  '#0A0A0A',
    surfaceContainerLow:     '#1A1A1A',
    surfaceContainer:        '#1E1E1E',
    surfaceContainerHigh:    '#282828',
    surfaceContainerHighest: '#333333',
    elevation: {
      level0: 'transparent',
      level1: 'rgba(200,200,200,0.05)',
      level2: 'rgba(200,200,200,0.08)',
      level3: 'rgba(200,200,200,0.11)',
      level4: 'rgba(200,200,200,0.12)',
      level5: 'rgba(200,200,200,0.14)',
    },
    accent:       '#555555',
    accentLight:  'rgba(85,85,85,0.12)',
    accentMedium: 'rgba(85,85,85,0.25)',
    success:      '#555555',
    successLight: 'rgba(85,85,85,0.12)',
    warning:      '#555555',
    warningLight: 'rgba(85,85,85,0.12)',
    isDark:       true,
    isGrayscale:  true,
    text:         '#888888',
    textMuted:    'rgba(136,136,136,0.6)',
    textSubtle:   'rgba(136,136,136,0.35)',
    card:         '#1a1a1a',
    cardElevated: '#222222',
    border:       'rgba(255,255,255,0.05)',
    inputBg:      '#222222',
    inputBorder:  'rgba(255,255,255,0.06)',
    navBg:        '#1e1e26',
    overlay:      'rgba(0,0,0,0.8)',
    statusActive:  '#555555',
    statusRepair:  '#666666',
    statusRetired: '#444444',
  };
  return { ...base, colors: { ...base.colors, ...colors } };
};

// ─── getColors — legacy compat ────────────────────────────────
// Your existing screens call getColors(theme, accentColor, isConnected)
// This keeps them working during migration
export const getColors = (theme = 'dark', accentColor = '#8B5CF6', isConnected = true) => {
  return buildM3Theme(accentColor, theme === 'dark').colors;
};

// ─── Typography ───────────────────────────────────────────────
export const FONTS = {
  regular:  'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

// ─── Spacing (4pt grid) ───────────────────────────────────────
export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── Shape ────────────────────────────────────────────────────
export const RADIUS = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  28,
  full: 999,
};

// ─── Accent list ──────────────────────────────────────────────
export const ACCENT_LIST = [
  { key: 'violetPurple', label: 'Violet Purple', hex: '#8B5CF6' },
  { key: 'electricBlue', label: 'Electric Blue', hex: '#3B82F6' },
  { key: 'emeraldGreen', label: 'Emerald Green', hex: '#10B981' },
  { key: 'coralRed',     label: 'Coral Red',     hex: '#F43F5E' },
  { key: 'amberGold',    label: 'Amber Gold',     hex: '#F59E0B' },
  { key: 'cyanTeal',     label: 'Cyan Teal',      hex: '#06B6D4' },
  { key: 'rosePink',     label: 'Rose Pink',      hex: '#EC4899' },
  { key: 'slateWhite',   label: 'Slate White',    hex: '#E2E8F0' },
];

// ─── M3 Motion tokens ─────────────────────────────────────────
export const MOTION = {
  standard:        { duration: 300, easing: [0.2, 0, 0, 1] },
  standardAccel:   { duration: 200, easing: [0.3, 0, 1, 1] },
  standardDecel:   { duration: 250, easing: [0, 0, 0, 1] },
  emphasized:      { duration: 500, easing: [0.2, 0, 0, 1] },
  emphasizedAccel: { duration: 200, easing: [0.3, 0, 0.8, 0.15] },
  emphasizedDecel: { duration: 400, easing: [0.05, 0.7, 0.1, 1] },
  spring:          { damping: 25, stiffness: 350 },
};
