import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Easing,
  StatusBar,
  useWindowDimensions,
} from 'react-native';

import SplashScene from './scenes/SplashScene';
import PhilosophyScene from './scenes/PhilosophyScene';
import ConnectScene from './scenes/ConnectScene';
import ThemeScene from './scenes/ThemeScene';
import AccentScene from './scenes/AccentScene';
import GoLiveScene from './scenes/GoLiveScene';
import OnboardingTopBar from './components/OnboardingTopBar';
import OnboardingNextButton from './components/OnboardingNextButton';

const BG_COLOR = 'rgb(245, 235, 226)';

const OnboardingScreen = ({ navigation }) => {
  const window = useWindowDimensions();
  const animController = useRef(new Animated.Value(0));
  const animValue = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    animController.current.addListener(({ value }) => {
      animValue.current = value;
      setCurrentPage(Math.round(value / 0.2));
    });
    return () => animController.current.removeAllListeners();
  }, []);

  const playAnimation = useCallback((toValue, duration = 1400) => {
    Animated.timing(animController.current, {
      toValue,
      duration,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1.0),
      useNativeDriver: true,
    }).start();
  }, []);

  const onNext = useCallback(() => {
    const cur = animValue.current;
    let to;
    if (cur < 0.05) to = 0.2;
    else if (cur <= 0.2) to = 0.4;
    else if (cur <= 0.4) to = 0.6;
    else if (cur <= 0.6) to = 0.8;
    else if (cur <= 0.8) to = 1.0;
    if (to !== undefined) playAnimation(to);
  }, [playAnimation]);

  const onBack = useCallback(() => {
    const cur = animValue.current;
    let to;
    if (cur >= 0.2 && cur < 0.4) to = 0.0;
    else if (cur >= 0.4 && cur < 0.6) to = 0.2;
    else if (cur >= 0.6 && cur < 0.8) to = 0.4;
    else if (cur >= 0.8 && cur < 1.05) to = 0.6;
    if (to !== undefined) playAnimation(to);
  }, [playAnimation]);

  const onSkip = useCallback(() => {
    playAnimation(0.8, 1200);
  }, [playAnimation]);

  const scenesTranslateY = animController.current.interpolate({
    inputRange: [0, 0.2, 1.0],
    outputRange: [window.height, 0, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <SplashScene animController={animController} onNext={onNext} window={window} />

      <Animated.View
        style={[{ position:'absolute', left:0, right:0, top:0, bottom:-150 }, { transform: [{ translateY: scenesTranslateY }] }]}
      >
        
        <PhilosophyScene animController={animController} window={window} />
        <ConnectScene animController={animController} window={window} onNext={onNext} />
        <ThemeScene animController={animController} window={window} />
        <AccentScene animController={animController} window={window} />
        <GoLiveScene animController={animController} window={window} />
      </Animated.View>

      <OnboardingTopBar animController={animController} onBack={onBack} onSkip={onSkip} window={window} />
      <OnboardingNextButton animController={animController} onNext={onNext} currentPage={currentPage} window={window} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default OnboardingScreen;
