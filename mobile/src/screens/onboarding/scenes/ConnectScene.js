import React, { useRef, useState, useEffect, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator, Modal, Pressable, Easing,
  StatusBar, Dimensions,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import useAppStore from '../../../store/useAppStore';
import { checkHealth } from '../../../services/api';
import { BACKEND_TYPES } from '../../../constants/config';

const { width: SW, height: SH } = Dimensions.get('screen');
const SHX = SH * 1.15; // extend past nav bar

// ─── STATIC forest SVG — rendered once, never changes ────────────────────────
const ForestStatic = memo(() => (
  <Svg
    style={StyleSheet.absoluteFillObject}
    width={SW} height={SH}
    viewBox={`0 0 ${SW} ${SH}`}
    pointerEvents="none"
  >
    <Defs>
      <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%"   stopColor="#050d10" stopOpacity="1"/>
        <Stop offset="35%"  stopColor="#091e28" stopOpacity="1"/>
        <Stop offset="70%"  stopColor="#0d2e3a" stopOpacity="1"/>
        <Stop offset="100%" stopColor="#081820" stopOpacity="1"/>
      </LinearGradient>
      <RadialGradient id="moon" cx="50%" cy="26%" rx="30%" ry="22%">
        <Stop offset="0%"   stopColor="#2a7a90" stopOpacity="0.5"/>
        <Stop offset="100%" stopColor="#091e28" stopOpacity="0"/>
      </RadialGradient>
      <LinearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%"   stopColor="#071c22" stopOpacity="1"/>
        <Stop offset="100%" stopColor="#030e12" stopOpacity="1"/>
      </LinearGradient>
    </Defs>

    <Rect x="0" y="0" width={SW} height={SH} fill="url(#sky)"/>
    <Rect x="0" y="0" width={SW} height={SH} fill="url(#moon)"/>

    {/* BG trees */}
    <Path d={`M${SW*0.03} ${SH} C${SW*0.0} ${SH*0.5} ${SW*0.02} ${SH*0.15} ${SW*0.08} 0 C${SW*0.14} ${SH*0.15} ${SW*0.16} ${SH*0.5} ${SW*0.13} ${SH} Z`} fill="#2a5060" opacity="0.6"/>
    <Path d={`M${SW*0.17} ${SH} C${SW*0.13} ${SH*0.52} ${SW*0.15} ${SH*0.18} ${SW*0.22} 0 C${SW*0.29} ${SH*0.18} ${SW*0.31} ${SH*0.52} ${SW*0.27} ${SH} Z`} fill="#224858" opacity="0.58"/>
    <Path d={`M${SW*0.33} ${SH} C${SW*0.28} ${SH*0.55} ${SW*0.31} ${SH*0.12} ${SW*0.38} 0 C${SW*0.45} ${SH*0.12} ${SW*0.47} ${SH*0.55} ${SW*0.43} ${SH} Z`} fill="#2a5060" opacity="0.6"/>
    <Path d={`M${SW*0.50} ${SH} C${SW*0.45} ${SH*0.5} ${SW*0.47} ${SH*0.2} ${SW*0.54} 0 C${SW*0.61} ${SH*0.2} ${SW*0.63} ${SH*0.5} ${SW*0.59} ${SH} Z`} fill="#224858" opacity="0.58"/>
    <Path d={`M${SW*0.67} ${SH} C${SW*0.62} ${SH*0.52} ${SW*0.64} ${SH*0.16} ${SW*0.71} 0 C${SW*0.78} ${SH*0.16} ${SW*0.80} ${SH*0.52} ${SW*0.76} ${SH} Z`} fill="#2a5060" opacity="0.6"/>
    <Path d={`M${SW*0.83} ${SH} C${SW*0.78} ${SH*0.55} ${SW*0.80} ${SH*0.22} ${SW*0.87} 0 C${SW*0.94} ${SH*0.22} ${SW*0.96} ${SH*0.55} ${SW*0.92} ${SH} Z`} fill="#224858" opacity="0.58"/>

    {/* Mid trees */}
    <Path d={`M${SW*-0.04} ${SH} C${SW*-0.02} ${SH*0.48} ${SW*0.04} ${SH*0.1} ${SW*0.1} ${SH*0.03} C${SW*0.16} ${SH*0.1} ${SW*0.22} ${SH*0.48} ${SW*0.18} ${SH} Z`} fill="#1a3d4e" opacity="0.95"/>
    <Path d={`M${SW*0.1} ${SH} C${SW*0.12} ${SH*0.46} ${SW*0.17} ${SH*0.08} ${SW*0.24} ${SH*0.02} C${SW*0.31} ${SH*0.08} ${SW*0.36} ${SH*0.46} ${SW*0.32} ${SH} Z`} fill="#163244" opacity="0.96"/>
    <Path d={`M${SW*0.25} ${SH} C${SW*0.22} ${SH*0.48} ${SW*0.27} ${SH*0.06} ${SW*0.34} ${SH*0.01} C${SW*0.41} ${SH*0.06} ${SW*0.46} ${SH*0.48} ${SW*0.42} ${SH} Z`} fill="#1a3d4e" opacity="0.95"/>
    <Path d={`M${SW*0.42} ${SH} C${SW*0.4} ${SH*0.5} ${SW*0.45} ${SH*0.08} ${SW*0.52} ${SH*0.02} C${SW*0.59} ${SH*0.08} ${SW*0.64} ${SH*0.5} ${SW*0.60} ${SH} Z`} fill="#163244" opacity="0.93"/>
    <Path d={`M${SW*0.59} ${SH} C${SW*0.56} ${SH*0.48} ${SW*0.61} ${SH*0.1} ${SW*0.68} ${SH*0.03} C${SW*0.75} ${SH*0.1} ${SW*0.80} ${SH*0.48} ${SW*0.76} ${SH} Z`} fill="#1a3d4e" opacity="0.95"/>
    <Path d={`M${SW*0.76} ${SH} C${SW*0.73} ${SH*0.5} ${SW*0.78} ${SH*0.12} ${SW*0.85} ${SH*0.04} C${SW*0.92} ${SH*0.12} ${SW*0.97} ${SH*0.5} ${SW*0.93} ${SH} Z`} fill="#163244" opacity="0.92"/>

    {/* Branches */}
    <Path d={`M${SW*0.03} ${SH*0.28} C${SW*0.14} ${SH*0.2} ${SW*0.27} ${SH*0.18} ${SW*0.38} ${SH*0.22}`} stroke="#1a3e4c" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7"/>
    <Path d={`M${SW*0.38} ${SH*0.22} C${SW*0.48} ${SH*0.16} ${SW*0.58} ${SH*0.15} ${SW*0.67} ${SH*0.19}`} stroke="#183848" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.68"/>
    <Path d={`M${SW*0.67} ${SH*0.19} C${SW*0.75} ${SH*0.13} ${SW*0.82} ${SH*0.15} ${SW*0.92} ${SH*0.2}`} stroke="#1a3e4c" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
    <Path d={`M${SW*0.15} ${SH*0.14} C${SW*0.26} ${SH*0.08} ${SW*0.4} ${SH*0.07} ${SW*0.52} ${SH*0.11}`} stroke="#163848" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.55"/>
    <Path d={`M${SW*0.52} ${SH*0.11} C${SW*0.62} ${SH*0.06} ${SW*0.72} ${SH*0.07} ${SW*0.82} ${SH*0.1}`} stroke="#163848" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.52"/>

    {/* FG trunks */}
    <Path d={`M${SW*-0.12} ${SH} C${SW*-0.04} ${SH*0.4} ${SW*0.04} ${SH*0.05} ${SW*0.13} 0 C${SW*0.22} ${SH*0.05} ${SW*0.28} ${SH*0.4} ${SW*0.22} ${SH} Z`} fill="#071420" opacity="1"/>
    <Path d={`M${SW*0.78} ${SH} C${SW*0.83} ${SH*0.38} ${SW*0.88} ${SH*0.04} ${SW*0.96} 0 C${SW*1.04} ${SH*0.04} ${SW*1.10} ${SH*0.38} ${SW*1.12} ${SH} Z`} fill="#071420" opacity="1"/>
    <Path d={`M${SW*0.27} ${SH} C${SW*0.28} ${SH*0.52} ${SW*0.31} ${SH*0.05} ${SW*0.38} 0 C${SW*0.45} ${SH*0.05} ${SW*0.48} ${SH*0.52} ${SW*0.45} ${SH} Z`} fill="#081820" opacity="0.97"/>
    <Path d={`M${SW*0.55} ${SH} C${SW*0.56} ${SH*0.52} ${SW*0.59} ${SH*0.07} ${SW*0.66} 0 C${SW*0.73} ${SH*0.07} ${SW*0.76} ${SH*0.52} ${SW*0.73} ${SH} Z`} fill="#081820" opacity="0.96"/>

    {/* Ground */}
    <Path d={`M0 ${SH*0.8} Q${SW*0.25} ${SH*0.76} ${SW*0.5} ${SH*0.8} Q${SW*0.75} ${SH*0.84} ${SW} ${SH*0.8} L${SW} ${SH} L0 ${SH} Z`} fill="url(#gnd)" opacity="1"/>

    {/* Undergrowth */}
    <Path d={`M${SW*0.06} ${SH*0.82} Q${SW*0.042} ${SH*0.76} ${SW*0.048} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.12} ${SH*0.82} Q${SW*0.138} ${SH*0.76} ${SW*0.134} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.19} ${SH*0.82} Q${SW*0.172} ${SH*0.76} ${SW*0.181} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.27} ${SH*0.82} Q${SW*0.288} ${SH*0.76} ${SW*0.284} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.35} ${SH*0.82} Q${SW*0.332} ${SH*0.76} ${SW*0.339} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.43} ${SH*0.82} Q${SW*0.448} ${SH*0.76} ${SW*0.444} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.51} ${SH*0.82} Q${SW*0.492} ${SH*0.76} ${SW*0.499} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.59} ${SH*0.82} Q${SW*0.608} ${SH*0.76} ${SW*0.604} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.67} ${SH*0.82} Q${SW*0.652} ${SH*0.76} ${SW*0.659} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.75} ${SH*0.82} Q${SW*0.768} ${SH*0.76} ${SW*0.764} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.83} ${SH*0.82} Q${SW*0.812} ${SH*0.76} ${SW*0.819} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6"/>
    <Path d={`M${SW*0.91} ${SH*0.82} Q${SW*0.928} ${SH*0.76} ${SW*0.924} ${SH*0.7}`} stroke="#1a3e48" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.6"/>
  </Svg>
));

// ─── ALIVE OVERLAY ────────────────────────────────────────────────────────────
const AliveOverlay = memo(({ opacity }) => (
  <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
    <Svg style={StyleSheet.absoluteFillObject} width={SW} height={SHX}
         viewBox={`0 0 ${SW} ${SHX}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="aSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#0a2016" stopOpacity="1"/>
          <Stop offset="35%"  stopColor="#1a5030" stopOpacity="1"/>
          <Stop offset="100%" stopColor="#0e2a18" stopOpacity="1"/>
        </LinearGradient>
        <RadialGradient id="sunGl" cx="50%" cy="14%" rx="40%" ry="30%">
          <Stop offset="0%"   stopColor="#80d858" stopOpacity="0.38"/>
          <Stop offset="55%"  stopColor="#38a040" stopOpacity="0.12"/>
          <Stop offset="100%" stopColor="#1a5030" stopOpacity="0"/>
        </RadialGradient>
        <LinearGradient id="aGnd" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#142e10" stopOpacity="1"/>
          <Stop offset="100%" stopColor="#0a1e08" stopOpacity="1"/>
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={SW} height={SH} fill="url(#aSky)"/>
      <Rect x="0" y="0" width={SW} height={SH} fill="url(#sunGl)"/>

      {/* Green trees */}
      <Path d={`M${SW*0.02} ${SH} C${SW*0.012} ${SH*0.48} ${SW*0.016} ${SH*0.1} ${SW*0.03} ${SH*0.03} C${SW*0.044} ${SH*0.1} ${SW*0.05} ${SH*0.48} ${SW*0.044} ${SH} Z`} fill="#122e18" opacity="0.92"/>
      <Path d={`M${SW*0.14} ${SH} C${SW*0.132} ${SH*0.46} ${SW*0.136} ${SH*0.08} ${SW*0.15} ${SH*0.02} C${SW*0.164} ${SH*0.08} ${SW*0.17} ${SH*0.46} ${SW*0.164} ${SH} Z`} fill="#102814" opacity="0.94"/>
      <Path d={`M${SW*0.29} ${SH} C${SW*0.282} ${SH*0.48} ${SW*0.286} ${SH*0.06} ${SW*0.3} ${SH*0.01} C${SW*0.314} ${SH*0.06} ${SW*0.32} ${SH*0.48} ${SW*0.314} ${SH} Z`} fill="#122e18" opacity="0.92"/>
      <Path d={`M${SW*0.46} ${SH} C${SW*0.452} ${SH*0.5} ${SW*0.456} ${SH*0.08} ${SW*0.47} ${SH*0.02} C${SW*0.484} ${SH*0.08} ${SW*0.49} ${SH*0.5} ${SW*0.484} ${SH} Z`} fill="#102814" opacity="0.9"/>
      <Path d={`M${SW*0.63} ${SH} C${SW*0.622} ${SH*0.48} ${SW*0.626} ${SH*0.1} ${SW*0.64} ${SH*0.03} C${SW*0.654} ${SH*0.1} ${SW*0.66} ${SH*0.48} ${SW*0.654} ${SH} Z`} fill="#122e18" opacity="0.91"/>
      <Path d={`M${SW*0.79} ${SH} C${SW*0.782} ${SH*0.5} ${SW*0.786} ${SH*0.12} ${SW*0.8} ${SH*0.04} C${SW*0.814} ${SH*0.12} ${SW*0.82} ${SH*0.5} ${SW*0.814} ${SH} Z`} fill="#102814" opacity="0.88"/>
      <Path d={`M${SW*-0.07} ${SH} C${SW*-0.02} ${SH*0.4} ${SW*0.025} ${SH*0.05} ${SW*0.09} 0 C${SW*0.155} ${SH*0.05} ${SW*0.2} ${SH*0.4} ${SW*0.17} ${SH} Z`} fill="#091a0e" opacity="1"/>
      <Path d={`M${SW*0.85} ${SH} C${SW*0.875} ${SH*0.38} ${SW*0.91} ${SH*0.04} ${SW*0.955} 0 C${SW*1.0} ${SH*0.04} ${SW*1.04} ${SH*0.38} ${SW*1.07} ${SH} Z`} fill="#091a0e" opacity="1"/>

      {/* Canopy */}
      <Path d={`M${SW*0.05} ${SH*0.14} C${SW*-0.04} ${SH*0.03} ${SW*-0.02} ${SH*-0.04} ${SW*0.06} ${SH*0.06} C${SW*0.12} ${SH*-0.01} ${SW*0.2} ${SH*0.04} ${SW*0.21} ${SH*0.15} C${SW*0.22} ${SH*0.26} ${SW*0.12} ${SH*0.28} ${SW*0.05} ${SH*0.14}Z`} fill="#1c5024" opacity="0.88"/>
      <Path d={`M${SW*0.28} ${SH*0.08} C${SW*0.18} ${SH*-0.03} ${SW*0.2} ${SH*-0.07} ${SW*0.3} ${SH*0.01} C${SW*0.36} ${SH*-0.06} ${SW*0.45} ${SH*-0.02} ${SW*0.46} ${SH*0.1} C${SW*0.47} ${SH*0.22} ${SW*0.37} ${SH*0.24} ${SW*0.28} ${SH*0.08}Z`} fill="#1e5826" opacity="0.9"/>
      <Path d={`M${SW*0.53} ${SH*0.06} C${SW*0.43} ${SH*-0.05} ${SW*0.44} ${SH*-0.08} ${SW*0.53} ${SH*0.0} C${SW*0.6} ${SH*-0.06} ${SW*0.68} ${SH*-0.02} ${SW*0.69} ${SH*0.1} C${SW*0.7} ${SH*0.22} ${SW*0.6} ${SH*0.24} ${SW*0.53} ${SH*0.06}Z`} fill="#1c5024" opacity="0.88"/>
      <Path d={`M${SW*0.73} ${SH*0.05} C${SW*0.63} ${SH*-0.06} ${SW*0.64} ${SH*-0.08} ${SW*0.73} ${SH*-0.01} C${SW*0.79} ${SH*-0.07} ${SW*0.87} ${SH*-0.03} ${SW*0.88} ${SH*0.09} C${SW*0.89} ${SH*0.2} ${SW*0.8} ${SH*0.22} ${SW*0.73} ${SH*0.05}Z`} fill="#22602c" opacity="0.86"/>

      {/* Ground */}
      <Path d={`M0 ${SH*0.8} Q${SW*0.25} ${SH*0.76} ${SW*0.5} ${SH*0.8} Q${SW*0.75} ${SH*0.84} ${SW} ${SH*0.8} L${SW} ${SH} L0 ${SH} Z`} fill="url(#aGnd)" opacity="1"/>

      {/* Alive grass — straight lines */}
      <Path d={`M${SW*0.06} ${SH*0.83} L${SW*0.042} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.13} ${SH*0.83} L${SW*0.148} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.20} ${SH*0.83} L${SW*0.187} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.28} ${SH*0.83} L${SW*0.297} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.36} ${SH*0.83} L${SW*0.343} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.44} ${SH*0.83} L${SW*0.457} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.52} ${SH*0.83} L${SW*0.503} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.60} ${SH*0.83} L${SW*0.617} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.68} ${SH*0.83} L${SW*0.663} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.76} ${SH*0.83} L${SW*0.777} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.84} ${SH*0.83} L${SW*0.823} ${SH*0.72}`} stroke="#48ae2c" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <Path d={`M${SW*0.92} ${SH*0.83} L${SW*0.937} ${SH*0.72}`} stroke="#3c9c24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
    </Svg>
  </Animated.View>
));

// ─── GOD RAYS ─────────────────────────────────────────────────────────────────
const RaysOverlay = memo(({ opacity }) => (
  <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
    <Svg style={StyleSheet.absoluteFillObject} width={SW} height={SHX}
         viewBox={`0 0 ${SW} ${SHX}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="ray1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#a0e060" stopOpacity="0.28"/>
          <Stop offset="100%" stopColor="#a0e060" stopOpacity="0"/>
        </LinearGradient>
        <LinearGradient id="ray2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#c0f080" stopOpacity="0.32"/>
          <Stop offset="100%" stopColor="#c0f080" stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={`M${SW*0.44} 0 L${SW*0.48} 0 L${SW*0.54} ${SH*0.75} L${SW*0.38} ${SH*0.75} Z`} fill="url(#ray2)"/>
      <Path d={`M${SW*0.34} 0 L${SW*0.37} 0 L${SW*0.42} ${SH*0.72} L${SW*0.28} ${SH*0.72} Z`} fill="url(#ray1)"/>
      <Path d={`M${SW*0.55} 0 L${SW*0.58} 0 L${SW*0.65} ${SH*0.7} L${SW*0.5} ${SH*0.7} Z`} fill="url(#ray1)" opacity="0.85"/>
      <Path d={`M${SW*0.62} 0 L${SW*0.64} 0 L${SW*0.69} ${SH*0.65} L${SW*0.58} ${SH*0.65} Z`} fill="url(#ray1)" opacity="0.7"/>
    </Svg>
  </Animated.View>
));

const DeadRays = memo(({ opacity }) => (
  <Animated.View style={[StyleSheet.absoluteFillObject, { opacity }]} pointerEvents="none">
    <Svg style={StyleSheet.absoluteFillObject} width={SW} height={SHX}
         viewBox={`0 0 ${SW} ${SHX}`} pointerEvents="none">
      <Defs>
        <LinearGradient id="dr" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#3a88a0" stopOpacity="0.14"/>
          <Stop offset="100%" stopColor="#3a88a0" stopOpacity="0"/>
        </LinearGradient>
      </Defs>
      <Path d={`M${SW*0.45} 0 L${SW*0.48} 0 L${SW*0.52} ${SH*0.6} L${SW*0.42} ${SH*0.6} Z`} fill="url(#dr)"/>
      <Path d={`M${SW*0.35} 0 L${SW*0.37} 0 L${SW*0.4} ${SH*0.55} L${SW*0.3} ${SH*0.55} Z`} fill="url(#dr)" opacity="0.7"/>
      <Path d={`M${SW*0.57} 0 L${SW*0.59} 0 L${SW*0.63} ${SH*0.5} L${SW*0.54} ${SH*0.5} Z`} fill="url(#dr)" opacity="0.7"/>
    </Svg>
  </Animated.View>
));

// ─── MIST ─────────────────────────────────────────────────────────────────────
const MistPanel = memo(({ id, color, startX, toX, dur, delay, yPos, h, op }) => {
  const tx = useRef(new Animated.Value(startX)).current;
  useEffect(() => {
    const run = () => {
      tx.setValue(startX);
      Animated.timing(tx, { toValue: toX, duration: dur, easing: Easing.linear, useNativeDriver: true }).start(run);
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, []);
  const W = SW * 2.2;
  return (
    <Animated.View pointerEvents="none"
      style={{ position:'absolute', top:yPos, left:0, width:W, height:h, opacity:op, transform:[{translateX:tx}] }}>
      <Svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} pointerEvents="none">
        <Defs>
          <LinearGradient id={`mg${id}`} x1="0" y1="0.5" x2="1" y2="0.5">
            <Stop offset="0%"   stopColor={color} stopOpacity="0"/>
            <Stop offset="20%"  stopColor={color} stopOpacity="0.65"/>
            <Stop offset="50%"  stopColor={color} stopOpacity="0.9"/>
            <Stop offset="80%"  stopColor={color} stopOpacity="0.65"/>
            <Stop offset="100%" stopColor={color} stopOpacity="0"/>
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={h} fill={`url(#mg${id})`}/>
        <Ellipse cx={W*0.35} cy={h*0.5} rx={W*0.25} ry={h*0.55} fill={color} opacity="0.25"/>
        <Ellipse cx={W*0.7}  cy={h*0.5} rx={W*0.2}  ry={h*0.45} fill={color} opacity="0.2"/>
      </Svg>
    </Animated.View>
  );
});

// ─── POLLEN ───────────────────────────────────────────────────────────────────
const Pollen = memo(({ x, y, color, delay, dur }) => {
  const ty = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      ty.setValue(0); op.setValue(0);
      Animated.parallel([
        Animated.timing(ty, { toValue: -70, duration: dur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(op, { toValue: 1,   duration: dur * 0.2, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0.7, duration: dur * 0.6, useNativeDriver: true }),
          Animated.timing(op, { toValue: 0,   duration: dur * 0.2, useNativeDriver: true }),
        ]),
      ]).start(() => setTimeout(run, 600 + Math.random() * 1200));
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={{
      position:'absolute', left:x, top:y, width:5, height:5, borderRadius:2.5,
      backgroundColor:color, opacity:op, transform:[{translateY:ty}],
    }}/>
  );
});

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const ConnectScene = ({ animController, window, onNext }) => {
  const setBackendUrl   = useAppStore((s) => s.setBackendUrl);
  const setIsConnected  = useAppStore((s) => s.setIsConnected);
  const setIsConnecting = useAppStore((s) => s.setIsConnecting);

  const [selectedType, setSelectedType] = useState(BACKEND_TYPES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [url,        setUrl]        = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState('');
  const [phase,      setPhase]      = useState('dead');

  const mistOp   = useRef(new Animated.Value(1)).current;
  const aliveOp  = useRef(new Animated.Value(0)).current;
  const raysOp   = useRef(new Animated.Value(0)).current;
  const pollenOp = useRef(new Animated.Value(0)).current;
  const errShake = useRef(new Animated.Value(0)).current;

  const slideX = animController.current.interpolate({
    inputRange:  [0, 0.2, 0.4, 0.6, 1.0],
    outputRange: [window.width, window.width, 0, -window.width, -window.width],
  });
  const titleX = animController.current.interpolate({
    inputRange:  [0, 0.2, 0.4, 0.6, 1.0],
    outputRange: [window.width*2, window.width*2, 0, -window.width*2, -window.width*2],
  });
  const bodyOp = animController.current.interpolate({
    inputRange:  [0.3, 0.4, 0.55, 0.6],
    outputRange: [0, 1, 1, 0],
  });

  const runBloom = () => {
    Animated.timing(mistOp, { toValue:0, duration:2200, easing:Easing.out(Easing.quad), useNativeDriver:true }).start();
    Animated.sequence([Animated.delay(1800), Animated.timing(aliveOp, { toValue:1, duration:2400, easing:Easing.inOut(Easing.quad), useNativeDriver:true })]).start();
    Animated.sequence([Animated.delay(2800), Animated.timing(raysOp,  { toValue:1, duration:2200, easing:Easing.out(Easing.cubic), useNativeDriver:true })]).start();
    Animated.sequence([Animated.delay(5000), Animated.timing(pollenOp,{ toValue:1, duration:1800, easing:Easing.out(Easing.quad),  useNativeDriver:true })]).start();
  };

  const handleConnect = async () => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed) { setError('Please enter a backend URL'); return; }
    setError(''); setConnecting(true); setIsConnecting(true); setPhase('connecting');
    try {
      const healthy = await checkHealth(trimmed);
      if (healthy) {
        setIsConnecting(false); setBackendUrl(trimmed); setIsConnected(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        runBloom();
        setTimeout(() => { setPhase('alive'); setConnecting(false); }, 7200);
      } else {
        setIsConnecting(false); setConnecting(false); setPhase('dead');
        setError('Cannot reach server. Check the URL and try again.');
        Animated.sequence([
          Animated.timing(errShake,{toValue:-10,duration:60,useNativeDriver:true}),
          Animated.timing(errShake,{toValue:10, duration:60,useNativeDriver:true}),
          Animated.timing(errShake,{toValue:-6, duration:60,useNativeDriver:true}),
          Animated.timing(errShake,{toValue:6,  duration:60,useNativeDriver:true}),
          Animated.timing(errShake,{toValue:0,  duration:60,useNativeDriver:true}),
        ]).start();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setIsConnecting(false); setConnecting(false); setPhase('dead');
      setError('Connection failed. Please try again.');
    }
  };

  return (
    <Animated.View style={[S.root, { transform:[{translateX:slideX}] }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content"/>

      <ForestStatic/>
      <DeadRays opacity={mistOp}/>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: mistOp }]} pointerEvents="none">
        <MistPanel id="a" color="#1e5a6a" startX={-SW*1.0} toX={SW*0.3}  dur={22000} delay={0}    yPos={SH*0.42} h={SH*0.28} op={0.65}/>
        <MistPanel id="b" color="#1a5060" startX={SW*0.2}  toX={-SW*1.2} dur={26000} delay={4000} yPos={SH*0.56} h={SH*0.22} op={0.6}/>
        <MistPanel id="c" color="#1c5868" startX={-SW*0.6} toX={SW*0.5}  dur={18000} delay={2000} yPos={SH*0.65} h={SH*0.18} op={0.55}/>
      </Animated.View>

      <AliveOverlay opacity={aliveOp}/>
      <RaysOverlay  opacity={raysOp}/>

      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: pollenOp }]} pointerEvents="none">
        <Pollen x={SW*0.12} y={SH*0.64} color="#b0f070" delay={0}    dur={3600}/>
        <Pollen x={SW*0.28} y={SH*0.60} color="#fce880" delay={550}  dur={4000}/>
        <Pollen x={SW*0.44} y={SH*0.62} color="#b0f070" delay={1100} dur={3400}/>
        <Pollen x={SW*0.6}  y={SH*0.66} color="#fce880" delay={300}  dur={4200}/>
        <Pollen x={SW*0.74} y={SH*0.61} color="#b0f070" delay={800}  dur={3800}/>
        <Pollen x={SW*0.88} y={SH*0.65} color="#fce880" delay={1400} dur={3600}/>
      </Animated.View>

      <View style={S.overlay} pointerEvents="none"/>

      <View style={S.content}>
        <Animated.Text style={[S.label, {transform:[{translateX:titleX}]}]}>
          {phase==='alive' ? 'CONNECTED ✦' : 'CONNECT BACKEND'}
        </Animated.Text>
        <Animated.Text style={[S.heading, {transform:[{translateX:titleX}]}]}>
          {phase==='alive' ? 'AssetFlow\nhas a soul.' : 'Give it\na home.'}
        </Animated.Text>
        <Animated.View style={{opacity:bodyOp}}>
          {phase==='dead' && (<>
            <TouchableOpacity style={S.dropdown} onPress={()=>setDropdownOpen(true)}>
              <Text style={S.dtxt}>{selectedType.label}</Text>
              <ChevronDown size={16} color="rgba(180,225,195,0.5)"/>
            </TouchableOpacity>
            <TextInput
              style={S.input} value={url} onChangeText={setUrl}
              placeholder={selectedType.placeholder}
              placeholderTextColor="rgba(160,210,175,0.28)"
              autoCapitalize="none" autoCorrect={false} keyboardType="url"
              testID="backend-url-input"
            />
            <Text style={S.hint}>e.g. {selectedType.example}</Text>
            {!!error && <Animated.Text style={[S.err,{transform:[{translateX:errShake}]}]}>{error}</Animated.Text>}
          </>)}
          {phase==='connecting' && <Text style={S.ctxt}>Reaching into the forest…</Text>}
          {phase==='alive'      && <Text style={S.atxt}>The app now has data. Now let's give it character.</Text>}
          <TouchableOpacity
            style={[S.btn, phase==='alive' && S.btnAlive]}
            onPress={phase==='alive' ? onNext : handleConnect}
            disabled={connecting || phase==='connecting'}
            testID="connect-button"
          >
            {connecting||phase==='connecting' ? (
              <View style={S.row}>
                <ActivityIndicator color="rgba(175,238,185,0.85)" size="small" style={{marginRight:10}}/>
                <Text style={S.btxt}>Connecting…</Text>
              </View>
            ) : (
              <Text style={[S.btxt, phase==='alive' && {color:'#5ade88'}]}>
                {phase==='alive' ? 'Next — Give it character →' : 'Connect'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={()=>setDropdownOpen(false)}>
        <Pressable style={S.backdrop} onPress={()=>setDropdownOpen(false)}>
          <View style={S.menu}>
            {BACKEND_TYPES.map(type=>(
              <TouchableOpacity key={type.key} style={S.mitem}
                onPress={()=>{setSelectedType(type);setUrl('');setDropdownOpen(false);}}>
                <View>
                  <Text style={S.mlabel}>{type.label}</Text>
                  <Text style={S.mdesc}>{type.description}</Text>
                </View>
                {selectedType.key===type.key && <Check size={16} color="#7ae898"/>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  root:    { position:'absolute', left:0, top:0, width:'100%', height:'100%', overflow:'hidden' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(2,8,6,0.24)' },
  content: { position:'absolute', left:0, right:0, top:0, bottom:0, paddingHorizontal:32, paddingBottom:140, justifyContent:'center' },
  label:   { fontSize:11, fontFamily:'Inter_600SemiBold', color:'rgba(140,215,160,0.7)', letterSpacing:3, marginBottom:12 },
  heading: { fontSize:40, fontFamily:'Inter_700Bold', color:'rgb(210,236,218)', lineHeight:48, marginBottom:32, textShadowColor:'rgba(0,0,0,0.7)', textShadowOffset:{width:0,height:1}, textShadowRadius:10 },
  dropdown:{ height:52, borderRadius:14, borderWidth:1, borderColor:'rgba(140,215,160,0.2)', backgroundColor:'rgba(3,15,10,0.65)', flexDirection:'row', alignItems:'center', paddingHorizontal:16, justifyContent:'space-between', marginBottom:10 },
  dtxt:    { color:'rgba(200,232,210,0.82)', fontSize:15, fontFamily:'Inter_400Regular' },
  input:   { height:52, borderRadius:14, borderWidth:1, borderColor:'rgba(140,215,160,0.2)', backgroundColor:'rgba(3,15,10,0.65)', paddingHorizontal:16, color:'rgb(210,236,218)', fontSize:15, fontFamily:'Inter_400Regular', marginBottom:8 },
  hint:    { fontSize:12, fontFamily:'Inter_400Regular', color:'rgba(140,215,160,0.38)', marginBottom:20 },
  err:     { color:'#f87171', fontSize:13, fontFamily:'Inter_400Regular', marginBottom:12 },
  ctxt:    { fontSize:15, fontFamily:'Inter_400Regular', color:'rgba(140,215,160,0.58)', lineHeight:22, marginBottom:24, fontStyle:'italic' },
  atxt:    { fontSize:15, fontFamily:'Inter_400Regular', color:'rgba(200,232,210,0.82)', lineHeight:24, marginBottom:24 },
  btn:     { height:56, borderRadius:28, backgroundColor:'rgba(3,15,10,0.7)', borderWidth:1, borderColor:'rgba(140,215,160,0.28)', alignItems:'center', justifyContent:'center', marginTop:4 },
  btnAlive:{ backgroundColor:'rgba(16,68,28,0.8)', borderColor:'#5ade88', borderWidth:1.5 },
  row:     { flexDirection:'row', alignItems:'center' },
  btxt:    { color:'rgba(205,235,215,0.95)', fontSize:16, fontFamily:'Inter_600SemiBold' },
  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', paddingHorizontal:28 },
  menu:    { backgroundColor:'#061610', borderRadius:16, overflow:'hidden', borderWidth:1, borderColor:'rgba(140,215,160,0.15)' },
  mitem:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor:'rgba(140,215,160,0.09)' },
  mlabel:  { color:'rgb(210,236,218)', fontSize:15, fontFamily:'Inter_600SemiBold', marginBottom:2 },
  mdesc:   { color:'rgba(140,215,160,0.48)', fontSize:12, fontFamily:'Inter_400Regular' },
});

export default ConnectScene;
