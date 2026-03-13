import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import useAppStore from '../store/useAppStore';
import { checkHealth, primeApiCache } from '../services/api';
import { HEALTH_CHECK_INTERVAL } from '../constants/config';

export const useConnection = () => {
  const { backendUrl, setIsConnected, token } = useAppStore();
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isCheckingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const prevCacheRef = useRef(null);
  if (prevCacheRef.current !== backendUrl + token) {
    prevCacheRef.current = backendUrl + token;
    primeApiCache(backendUrl, token);
  }

  const performCheck = async () => {
    if (!backendUrl || !isMountedRef.current) return;
    if (isCheckingRef.current) return; // prevent race condition
    if (appStateRef.current !== 'active') return; // pause when backgrounded
    isCheckingRef.current = true;
    try {
      const healthy = await checkHealth(backendUrl);
      if (isMountedRef.current) {
        const current = useAppStore.getState().isConnected;
        if (healthy !== current) setIsConnected(healthy);
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (!backendUrl) return;

    performCheck();
    intervalRef.current = setInterval(performCheck, HEALTH_CHECK_INTERVAL);

    const unsubNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected) setIsConnected(false);
      else performCheck();
    });

    const unsubAppState = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
      if (nextState === 'active') performCheck();
    });

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsubNetInfo();
      unsubAppState.remove();
    };
  }, [backendUrl]);
};
