let _bgRefreshRunning = false;
let _toastTimerRef = null;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { primeApiCache } from '../services/api';
import { prefetchAll, startBackgroundRefresh, stopBackgroundRefresh, clearAllCache } from '../services/DataCacheService';

export const themeTransitionRef = { onToggle: null };

const useAppStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      backendUrl: null,
      isConnected: false,
      isConnecting: false,
    offlineToast: 0,
      setBackendUrl: (url) => set({ backendUrl: url }),
      setIsConnecting: (val) => set({ isConnecting: val }),

      setIsConnected: (val) => {
        set({ isConnected: val });
        if (val) {
          const { backendUrl, token } = get();
          if (backendUrl && token) {
            primeApiCache(backendUrl, token);
            prefetchAll();
            if (!_bgRefreshRunning) { _bgRefreshRunning = true; startBackgroundRefresh(); }
          }
        } else {
          _bgRefreshRunning = false;
          stopBackgroundRefresh();
        }
      },

      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),

      loginSuccess: (token, user) => {
        set({ token, user });
        const { backendUrl } = get();
        if (backendUrl) {
          primeApiCache(backendUrl, token);
          prefetchAll();
          if (!_bgRefreshRunning) { _bgRefreshRunning = true; startBackgroundRefresh(); }
        }
      },

      logout: () => {
        clearAllCache();
        _bgRefreshRunning = false;
        stopBackgroundRefresh();
        set({ token: null, user: null });
      },

      onboardingComplete: false,
      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      theme: 'light',
      accentColor: '#8B5CF6',
      setTheme: (theme) => set({ theme }),
      setAccentColor: (color) => set({ accentColor: color }),

      toggleTheme: () => {
        const { theme, setTheme } = get();
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        if (themeTransitionRef.onToggle) {
          themeTransitionRef.onToggle(nextTheme, () => setTheme(nextTheme));
        } else {
          setTheme(nextTheme);
        }
      },

      showConnectionBubble: true,
      setShowConnectionBubble: (val) => set({ showConnectionBubble: val }),

      tabIndex: 0,
      prevTabIndex: 0,
      setTabIndex: (idx) => set((s) => ({ prevTabIndex: s.tabIndex, tabIndex: idx })),

      toast: null,
      stackNavigation: null,
  setStackNavigation: (nav) => set({ stackNavigation: nav }),
  pendingNav: null,
  setPendingNav: (screen) => set({ pendingNav: screen }),
  showOfflineError: () => {
    const id = Date.now();
    set({ offlineToast: id });
    setTimeout(() => {
      if (get().offlineToast === id) set({ offlineToast: 0 });
    }, 3500);
  },
  showToast: (message, type = 'error') => {
        if (_toastTimerRef) clearTimeout(_toastTimerRef);
        _toastTimerRef = setTimeout(() => { _toastTimerRef = null; set({ toast: null }); }, 3500);
        set({ toast: { message, type } });
      },
      hideToast: () => {
        if (_toastTimerRef) clearTimeout(_toastTimerRef);
        _toastTimerRef = null;
        set({ toast: null });
      },
    }),
    {
      name: 'assetflow-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        backendUrl: state.backendUrl,
        token: state.token,
        user: state.user,
        onboardingComplete: state.onboardingComplete,
        theme: state.theme,
        accentColor: state.accentColor,
        showConnectionBubble: state.showConnectionBubble,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          useAppStore.setState({ _hasHydrated: true });
          if (state.token && state.backendUrl) {
            primeApiCache(state.backendUrl, state.token);
            prefetchAll();
            if (!_bgRefreshRunning) { _bgRefreshRunning = true; startBackgroundRefresh(); }
          }
        }
      },
    }
  )
);

// Returns accent color — falls back to a readable color if too light
export const useAccentColor = () => {
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);
  if (!isConnected) return '#555555';
  return getSafeAccent(accentColor);
};

export const getSafeAccent = (hex) => {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.75 ? '#1E3A5F' : hex;
  } catch {
    return hex;
  }
};

// Use this for text/icon COLOR — returns black or white depending on accent brightness
export const getTextOnAccent = (hex) => {
  try {
    const c = (hex || '#000000').replace('#', '');
    const r = parseInt(c.substring(0,2), 16);
    const g = parseInt(c.substring(2,4), 16);
    const b = parseInt(c.substring(4,6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111111' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
};

export default useAppStore;
