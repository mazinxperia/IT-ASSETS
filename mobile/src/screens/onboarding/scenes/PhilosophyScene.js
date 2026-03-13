import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const NAVY = 'rgb(21, 32, 54)';

const PhilosophyScene = ({ animController, window }) => {
  const slideX = animController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 1.0],
    outputRange: [window.width, 0, -window.width, -window.width],
  });
  const titleX = animController.current.interpolate({
    inputRange: [0, 0.2, 0.4, 1.0],
    outputRange: [window.width * 2, 0, -window.width * 2, -window.width * 2],
  });
  const bodyOpacity = animController.current.interpolate({
    inputRange: [0.1, 0.2, 0.35, 0.4],
    outputRange: [0, 1, 1, 0],
  });
  const labelY = animController.current.interpolate({
    inputRange: [0, 0.2, 0.4],
    outputRange: [20, 0, -20],
  });
  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideX }] }]}>
      <Animated.Text style={[styles.label, { transform: [{ translateY: labelY }] }]}>
        BEFORE WE BEGIN
      </Animated.Text>
      <Animated.Text style={[styles.heading, { transform: [{ translateX: titleX }] }]}>
        Why this app{'\n'}needs a home.
      </Animated.Text>
      <Animated.View style={{ opacity: bodyOpacity }}>
        <View style={styles.divider} />
        <Text style={styles.bodyText}>
          AssetFlow works by connecting to your own backend server — the same one that powers your web dashboard. Enter the server URL on the next screen to bring it to life.
        </Text>
        <View style={styles.quoteBlock}>
          <Text style={styles.quoteText}>
            "Without connection, this app is just a shell. Give it a home. Give it data. And watch it come alive."
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgb(245, 235, 226)',
    paddingHorizontal: 32, paddingBottom: 140, justifyContent: 'center',
  },
  label: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(21,32,54,0.35)', letterSpacing: 3, marginBottom: 16,
  },
  heading: { fontSize: 40, fontFamily: 'Inter_700Bold', color: NAVY, lineHeight: 48, marginBottom: 32 },
  divider: { width: 40, height: 2, backgroundColor: 'rgba(21,32,54,0.15)', marginBottom: 20 },
  bodyText: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: 'rgba(21,32,54,0.6)', lineHeight: 24, marginBottom: 24,
  },
  quoteBlock: { borderLeftWidth: 2, borderLeftColor: 'rgba(21,32,54,0.15)', paddingLeft: 16 },
  quoteText: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    color: 'rgba(21,32,54,0.5)', lineHeight: 24, fontStyle: 'italic',
  },
});

export default PhilosophyScene;
