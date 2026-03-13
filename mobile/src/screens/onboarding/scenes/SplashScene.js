import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAVY = 'rgb(21, 32, 54)';

const CARDS = [
  { x: -30, y: '5%', w: 110, h: 70, r: 14, opacity: 0.07, rot: -12 },
  { x: '50%', y: '-2%', w: 90, h: 60, r: 12, opacity: 0.06, rot: 8 },
  { x: '72%', y: '12%', w: 80, h: 55, r: 10, opacity: 0.05, rot: -6 },
  { x: -10, y: '22%', w: 75, h: 100, r: 16, opacity: 0.06, rot: 15 },
  { x: '55%', y: '28%', w: 120, h: 65, r: 14, opacity: 0.04, rot: -10 },
  { x: '18%', y: '38%', w: 95, h: 60, r: 12, opacity: 0.07, rot: 5 },
  { x: '78%', y: '42%', w: 100, h: 70, r: 14, opacity: 0.05, rot: -8 },
  { x: -20, y: '55%', w: 115, h: 75, r: 16, opacity: 0.06, rot: 12 },
  { x: '42%', y: '58%', w: 85, h: 60, r: 10, opacity: 0.07, rot: -14 },
  { x: '68%', y: '65%', w: 100, h: 80, r: 18, opacity: 0.05, rot: 7 },
  { x: '10%', y: '72%', w: 80, h: 65, r: 12, opacity: 0.06, rot: -5 },
  { x: '52%', y: '76%', w: 105, h: 70, r: 14, opacity: 0.04, rot: 10 },
];

const FloatingCard = ({ card, index }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 3200 + index * 220, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 3200 + index * 220, useNativeDriver: true }),
        ])
      ).start();
    }, index * 120);
  }, []);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  return (
    <Animated.View
      style={{
        position: 'absolute', left: card.x, top: card.y,
        width: card.w, height: card.h, borderRadius: card.r,
        backgroundColor: NAVY, opacity: card.opacity,
        transform: [{ rotate: `${card.rot}deg` }, { translateY }],
      }}
    />
  );
};

const SplashScene = ({ animController, onNext, window }) => {
  const translateY = animController.current.interpolate({
    inputRange: [0, 0.2, 1.0],
    outputRange: [0, -window.height, -window.height],
  });
  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  const logoStyle = {
    opacity: logoAnim,
    transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
  };
  const contentStyle = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  };
  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY }] }]}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {CARDS.map((card, i) => <FloatingCard key={i} card={card} index={i} />)}
      </View>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.splashInner}>
          <Animated.View style={[styles.logoArea, logoStyle]}>
            <Image
              source={require('../../../../assets/logo.png')}
              style={styles.logoMark}
              resizeMode="contain"
            />
            <Text style={styles.logoTagline}>IT Asset Management</Text>
          </Animated.View>
          <Animated.View style={[styles.splashBottom, contentStyle]}>
            <Text style={styles.splashTitle}>AssetFlow</Text>
            <Text style={styles.splashSub}>Your infrastructure,{'\n'}beautifully managed.</Text>
            <TouchableOpacity onPress={onNext} activeOpacity={0.8}>
              <View style={styles.splashBtn}>
                <Text style={styles.splashBtnText}>Let's Begin</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  splashInner: { flex: 1, justifyContent: 'space-between', paddingBottom: 48 },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoMark: { width: 110, height: 110, marginBottom: 16 },
  logoTagline: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(21,32,54,0.4)', letterSpacing: 3, textTransform: 'uppercase',
  },
  splashBottom: { paddingHorizontal: 28 },
  splashTitle: { fontSize: 52, fontFamily: 'Inter_700Bold', color: NAVY, marginBottom: 8 },
  splashSub: {
    fontSize: 16, fontFamily: 'Inter_400Regular',
    color: 'rgba(21,32,54,0.5)', lineHeight: 24, marginBottom: 40,
  },
  splashBtn: {
    height: 60, backgroundColor: NAVY, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  splashBtnText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
});

export default SplashScene;
