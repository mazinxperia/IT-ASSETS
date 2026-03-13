import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import useAppStore from '../store/useAppStore';
import { prefetchAll, startBackgroundRefresh } from '../services/DataCacheService';
import OnboardingStack from './OnboardingStack';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

const Stack = createStackNavigator();

const fadeTransition = {
  cardStyleInterpolator: ({ current }) => ({
    cardStyle: { opacity: current.progress },
  }),
  transitionSpec: {
    open:  { animation: 'timing', config: { duration: 250 } },
    close: { animation: 'timing', config: { duration: 200 } },
  },
};

const _prefetchStarted = { current: false };

const RootNavigator = () => {
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const token = useAppStore((s) => s.token);
  const _hasHydrated = useAppStore((s) => s._hasHydrated);
  const isConnected = useAppStore((s) => s.isConnected);
  const [hydrateTimeout, setHydrateTimeout] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setHydrateTimeout(true), 3000); return () => clearTimeout(t); }, []);

  // Pre-cache all data as soon as user is logged in
  React.useEffect(() => {
    if (token && _hasHydrated && isConnected && !_prefetchStarted.current) {
      _prefetchStarted.current = true;
      prefetchAll();
      startBackgroundRefresh();
    }
  }, [token, _hasHydrated, isConnected]);

  if (!_hasHydrated && !hydrateTimeout) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#555555" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...fadeTransition }}>
      {!onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : !token ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
