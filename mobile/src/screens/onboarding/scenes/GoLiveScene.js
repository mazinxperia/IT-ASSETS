import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Wifi, Moon, Palette } from 'lucide-react-native';
import useAppStore from '../../../store/useAppStore';

const NAVY = 'rgb(21, 32, 54)';
const FEATURES = [
  { icon: Wifi, text: 'Stays connected to your live AssetFlow backend' },
  { icon: Moon, text: 'App goes grayscale if backend disconnects — and returns to life on reconnect' },
  { icon: Palette, text: 'Your theme and accent color apply everywhere' },
];

const GoLiveScene = ({ animController, window }) => {
  const accentColor = useAppStore((s) => s.accentColor);
  const setOnboardingComplete = useAppStore((s) => s.setOnboardingComplete);
  const slideX = animController.current.interpolate({
    inputRange: [0, 0.8, 1.0],
    outputRange: [window.width, window.width, 0],
  });
  const titleX = animController.current.interpolate({
    inputRange: [0, 0.8, 1.0],
    outputRange: [window.width * 2, window.width * 2, 0],
  });
  const bodyOpacity = animController.current.interpolate({
    inputRange: [0.9, 1.0],
    outputRange: [0, 1],
  });
  const handleGoLive = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOnboardingComplete(true);
  };
  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideX }] }]}>
      <Animated.Text style={[styles.label, { transform: [{ translateX: titleX }] }]}>READY</Animated.Text>
      <Animated.Text style={[styles.heading, { transform: [{ translateX: titleX }] }]}>AssetFlow{'\n'}is ready.</Animated.Text>
      <Animated.View style={{ opacity: bodyOpacity }}>
        <Text style={styles.sub}>Your app is connected and personalized. Here's what to expect:</Text>
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: `${accentColor}18` }]}>
                <f.icon size={16} color={accentColor} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[styles.goBtn, { backgroundColor: accentColor }]} onPress={handleGoLive} activeOpacity={0.85} testID="go-live-button">
          <Text style={styles.goBtnText}>Go Live Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingHorizontal: 32, paddingBottom: 80, justifyContent: 'center' },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(21,32,54,0.35)', letterSpacing: 3, marginBottom: 12 },
  heading: { fontSize: 40, fontFamily: 'Inter_700Bold', color: NAVY, lineHeight: 48, marginBottom: 12 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.5)', lineHeight: 22, marginBottom: 24 },
  features: { marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(21,32,54,0.07)', gap: 14 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(21,32,54,0.6)', lineHeight: 21, marginTop: 7 },
  goBtn: { height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  goBtnText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
});

export default GoLiveScene;
