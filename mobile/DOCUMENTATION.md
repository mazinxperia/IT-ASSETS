# AssetFlow Mobile — Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Dev Environment](#dev-environment)
6. [Features](#features)
7. [Onboarding Flow](#onboarding-flow)
8. [Navigation Flow](#navigation-flow)
9. [Screen Reference](#screen-reference)
10. [State Management](#state-management)
11. [API Integration](#api-integration)
12. [Connection & Health Check](#connection--health-check)
13. [Offline Mode](#offline-mode)
14. [Theming System](#theming-system)
15. [Animation Guidelines](#animation-guidelines)
16. [Caching](#caching)
17. [Building the APK](#building-the-apk)
18. [Role-Based Access](#role-based-access)
19. [How to Make Changes](#how-to-make-changes)
20. [Troubleshooting](#troubleshooting)

---

## Overview

**AssetFlow Mobile** is a React Native (Expo) companion app for the AssetFlow web platform. It connects to the same FastAPI backend that powers the web dashboard, providing a native mobile interface for managing assets, employees, subscriptions, transfers, and users.

The app is designed for internal IT teams. It is distributed as a standalone APK — not published to the Play Store.

---

## Architecture

```
Mobile App (React Native / Expo)
     |
     | HTTP (local network)
     v
FastAPI Backend (IT-ASSETS)
     |
     v
MongoDB Database
```

The mobile app is a pure client. All data lives in the FastAPI backend. The app stores the backend URL entered during onboarding and connects to it directly over the local network.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.76.9 | Core framework |
| Expo SDK | 52 | Build platform |
| React Navigation v6 | 6.x | Screen navigation |
| React Native Reanimated | 3.16.x | Animations |
| Zustand | 4.5.x | State management |
| AsyncStorage | 1.23.1 | Local persistence |
| Axios | 1.6.x | HTTP client |
| FlashList | 1.7.3 | High-performance lists |
| NetInfo | 11.4.1 | Network monitoring |
| Lucide React Native | 0.475.x | Icons |
| expo-build-properties | latest | Native build config |
| expo-haptics | latest | Haptic feedback |

---

## Project Structure

```
mobile/
├── App.js                          # Root component, font loading, theme, providers
├── app.json                        # Expo + EAS configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel + Reanimated plugin
├── eas.json                        # EAS build profiles
├── assets/
│   └── logo.png                    # App icon
└── src/
    ├── components/
    │   ├── BottomNav.js            # Floating pill tab bar (GNav-style)
    │   ├── ReconnectBubble.js      # Animated reconnect panel
    │   ├── OfflineToast.js         # Red pill offline error toast
    │   ├── AppAlert.js             # In-app alert component
    │   ├── EmptyState.js           # Empty list placeholder
    │   ├── SkeletonLoader.js       # Loading skeleton cards
    │   └── Toast.js                # Toast notifications
    │
    ├── constants/
    │   ├── config.js               # App config, roles, backend types, cache keys
    │   └── App.js                  # Theme colors, fonts, spacing, getColors()
    │
    ├── hooks/
    │   └── useConnection.js        # Health check polling, NetInfo listener
    │
    ├── navigation/
    │   ├── RootNavigator.js        # Root: Onboarding → Auth → Main
    │   ├── MainTabs.js             # Simultaneous tab renderer with parallax
    │   └── AssetsStack.js          # Nested stack for all content screens
    │
    ├── screens/
    │   ├── BootSplashScreen.js     # Animated logo on every launch
    │   ├── onboarding/
    │   │   ├── OnboardingScreen.js # Container + animation controller
    │   │   ├── scenes/
    │   │   │   ├── SplashScene.js
    │   │   │   ├── PhilosophyScene.js
    │   │   │   ├── ConnectScene.js
    │   │   │   ├── ThemeScene.js
    │   │   │   ├── AccentScene.js
    │   │   │   └── GoLiveScene.js
    │   │   └── components/
    │   │       ├── OnboardingTopBar.js
    │   │       └── OnboardingNextButton.js
    │   ├── auth/
    │   │   └── LoginScreen.js
    │   └── main/
    │       ├── DashboardScreen.js
    │       ├── AssetsHubScreen.js
    │       ├── AssetListScreen.js
    │       ├── AssetDetailScreen.js
    │       ├── AddAssetScreen.js
    │       ├── AssetTypesScreen.js
    │       ├── EmployeeListScreen.js
    │       ├── EmployeeDetailScreen.js
    │       ├── AddEmployeeScreen.js
    │       ├── EmployeeFieldsScreen.js
    │       ├── SubscriptionListScreen.js
    │       ├── SubscriptionDetailScreen.js
    │       ├── AddSubscriptionScreen.js
    │       ├── InventoryScreen.js
    │       ├── TransferScreen.js
    │       ├── UsersScreen.js
    │       └── AccountScreen.js
    │
    ├── services/
    │   └── api.js                  # Axios instance, all API calls, interceptors
    │
    └── store/
        └── useAppStore.js          # Zustand store with AsyncStorage persistence
```

---

## Dev Environment

**Start Expo:**
```bash
cd ~/Documents/IT-ASSETS-MOBILE/mobile && npx expo start --clear
```

**Mirror device (WiFi):**
```bash
cd ~/Documents/scrcpy && ./adb connect 192.168.1.178:5555 && ./scrcpy -e
```

**Mirror device (USB / office):**
```bash
cd ~/Documents/scrcpy && ./scrcpy -s R5CW72PQVPL
```

**Start backend (home):**
```bash
cd ~/Documents/IT-ASSETS/backend && source venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Backend URLs:**
- Home: `http://192.168.1.210:8001`
- Office: `http://10.255.254.61:8001`

**Test device:** Samsung SM-S908E (Galaxy S22 Ultra)

**EAS account:** `mazinxperia` — `ruknuddinmazin@gmail.com`

**EAS project:** `@mazinxperia/assetflow` (ID: `a4d73455-045f-47a8-8446-5b67454049e5`)

---

## Features

### Boot Splash
Runs on every launch. Animated logo with spring entrance. Transitions into onboarding (first run) or the main app.

### Onboarding (First Launch Only)
6-scene swipe flow. The ConnectScene features a cinematic dark forest SVG animation that runs at 60fps using only GPU-thread transforms. When the backend connects, the forest transitions from dead (teal/dark) to alive (green) over 7 seconds. Scenes: Welcome → Philosophy → Connect → Theme → Accent → GoLive.

### Dashboard
Animated stat cards with count-up numbers. Asset type breakdown. Assignment status summary. Pull-to-refresh.

### Asset Management
Full CRUD. List with search and status badges. Detail view. Add/Edit on same screen with pre-filled data. Role-gated delete.

### Employee Management
Full CRUD. Avatar initials. Custom field support. Role-gated delete.

### Subscription Tracking
Full CRUD. Cost display. SaaS subscription lifecycle tracking.

### Inventory
Filtered view of unassigned assets. Navigates to asset detail.

### Transfers
Transfer history with from/to employee and date.

### User Management
List users with role badges. Super Admin only delete.

### Account / Settings
Theme toggle, accent color picker, connection status, reconnect bubble toggle, logout.

### Cross-Cutting
- **Offline mode** — write operations blocked when disconnected, red pill toast appears from bottom
- **Reconnect bubble** — springs open from circle to full panel when backend unreachable; hidden during onboarding
- **Caching** — list data cached locally with 1hr TTL; shows cached data when offline
- **Pull-to-refresh** — on all list screens
- **Skeleton loaders** — shown while loading
- **Empty states** — contextual messages
- **Role-based access** — write/delete hidden for USER role
- **Toast notifications** — success/error feedback
- **Delete confirmations** — bottom sheet before any destructive action
- **Token expiry** — auto logout on 401
- **Android hardware back** — exit confirmation on main tabs
- **Haptic feedback** — on button taps

---

## Onboarding Flow

Onboarding is a single `OnboardingScreen` container that renders all 6 scenes simultaneously. A single `Animated.Value` (`animController`) drives all scene transitions — scenes slide in/out based on interpolated ranges of that shared value.

The ConnectScene handles its own backend URL input, health check logic, and the forest bloom animation. Once the user completes GoLiveScene, `onboardingComplete: true` is saved and onboarding never shows again.

---

## Navigation Flow

```
App Start
  │
  ├─ onboardingComplete = false → OnboardingScreen
  │
  ├─ token = null → AuthStack → LoginScreen
  │
  └─ token exists → MainTabs
      ├─ Dashboard
      ├─ Assets → AssetsStack
      │   ├─ AssetsHub
      │   ├─ AssetList → AssetDetail
      │   ├─ EmployeeList → EmployeeDetail
      │   ├─ SubscriptionList → SubscriptionDetail
      │   ├─ Inventory → AssetDetail
      │   ├─ Transfer
      │   ├─ AssetTypes
      │   ├─ EmployeeFields
      │   └─ Add screens
      ├─ Users
      └─ Account
```

**MainTabs architecture:** All four tab screens render simultaneously. Tab switching uses a single `Animated.Value` (`tabAnim`) with parallax transitions — screens slide horizontally rather than remounting. This preserves scroll positions and avoids mount flicker. Swipe gesture support is included.

---

## Screen Reference

| Screen | File | Navigator |
|---|---|---|
| BootSplashScreen | `BootSplashScreen.js` | Root |
| OnboardingScreen | `onboarding/OnboardingScreen.js` | Root |
| LoginScreen | `auth/LoginScreen.js` | AuthStack |
| DashboardScreen | `main/DashboardScreen.js` | MainTabs |
| AssetsHubScreen | `main/AssetsHubScreen.js` | AssetsStack |
| AssetListScreen | `main/AssetListScreen.js` | AssetsStack |
| AssetDetailScreen | `main/AssetDetailScreen.js` | AssetsStack |
| AddAssetScreen | `main/AddAssetScreen.js` | AssetsStack |
| AssetTypesScreen | `main/AssetTypesScreen.js` | AssetsStack |
| EmployeeListScreen | `main/EmployeeListScreen.js` | AssetsStack |
| EmployeeDetailScreen | `main/EmployeeDetailScreen.js` | AssetsStack |
| AddEmployeeScreen | `main/AddEmployeeScreen.js` | AssetsStack |
| EmployeeFieldsScreen | `main/EmployeeFieldsScreen.js` | AssetsStack |
| SubscriptionListScreen | `main/SubscriptionListScreen.js` | AssetsStack |
| SubscriptionDetailScreen | `main/SubscriptionDetailScreen.js` | AssetsStack |
| AddSubscriptionScreen | `main/AddSubscriptionScreen.js` | AssetsStack |
| InventoryScreen | `main/InventoryScreen.js` | AssetsStack |
| TransferScreen | `main/TransferScreen.js` | AssetsStack |
| UsersScreen | `main/UsersScreen.js` | MainTabs |
| AccountScreen | `main/AccountScreen.js` | MainTabs |

---

## State Management

Single Zustand store at `src/store/useAppStore.js` with AsyncStorage persistence.

### Persisted State

| Key | Type | Description |
|---|---|---|
| `backendUrl` | string | Backend server URL |
| `token` | string | JWT auth token |
| `user` | object | Current user data |
| `onboardingComplete` | boolean | First-run flag |
| `theme` | `'dark'` / `'light'` | UI theme |
| `accentColor` | string | Hex accent color |
| `showConnectionBubble` | boolean | Reconnect bubble visibility |

### Non-Persisted State

| Key | Type | Description |
|---|---|---|
| `isConnected` | boolean | Live backend reachability — always starts false |
| `isConnecting` | boolean | Connection attempt in progress |
| `offlineToast` | object | Offline error toast state |
| `toast` | object | General toast message |

`isConnected` is intentionally not persisted — it always starts as `false` on launch and is established fresh by the health check.

### Key Actions

| Action | Description |
|---|---|
| `setBackendUrl(url)` | Saves backend URL and warms the API cache |
| `setToken(token)` | Saves JWT and updates in-memory cache |
| `setIsConnected(bool)` | Updates connection state |
| `showOfflineError()` | Triggers the offline toast with debounce |
| `startBackgroundRefresh()` | Starts 30s polling loop (deduped) |
| `stopBackgroundRefresh()` | Stops polling — called on logout |
| `logout()` | Clears token, user, connection state |
| `resetApp()` | Full reset back to onboarding |

---

## API Integration

`src/services/api.js` — Axios instance with request/response interceptors.

The API reads `backendUrl` and `token` from an **in-memory cache** (not AsyncStorage on every request). This cache is primed on app mount via `primeApiCache()` and updated whenever `setBackendUrl` or `setToken` is called.

**Request interceptor:** Attaches `Authorization: Bearer <token>` header automatically.

**Response interceptor:** On 401, clears auth state and navigates to login using `require()` for the store reference (synchronous, timing-safe in standalone APKs).

### Health Check

The backend exposes `GET /health` which returns `{ "status": "ok" }`. This is the only endpoint used for connectivity checks.

### Endpoints Used

| Service | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `POST /api/auth/login` |
| Dashboard | `GET /api/dashboard/stats` |
| Assets | `GET/POST /api/assets`, `GET/PUT/DELETE /api/assets/:id` |
| Employees | `GET/POST /api/employees`, `GET/PUT/DELETE /api/employees/:id` |
| Subscriptions | `GET/POST /api/subscriptions`, `GET/PUT/DELETE /api/subscriptions/:id` |
| Transfers | `GET/POST /api/transfers` |
| Asset Types | `GET/POST /api/asset-types`, `DELETE /api/asset-types/:id` |
| Employee Fields | `GET/PUT /api/settings/employee-fields` |
| Users | `GET/POST /api/users`, `PUT/DELETE /api/users/:id` |

---

## Connection & Health Check

`src/hooks/useConnection.js` manages all connectivity logic for the main app:

- Polls `GET /health` every 30 seconds
- Pauses polling when the app is backgrounded (AppState listener)
- Listens for instant disconnect via NetInfo subscription
- Prevents simultaneous checks with an `isCheckingRef` guard flag
- Re-primes the API cache only when `backendUrl` or `token` changes

The ReconnectBubble is visible when `isConnected = false` and onboarding is complete. It springs open from a circle to a full reconnect panel with an input field for re-entering the backend URL.

---

## Offline Mode

When `isConnected = false`, all write operations across the app are blocked. Attempting any write triggers the OfflineToast.

**OfflineToast** (`src/components/OfflineToast.js`) is a red pill component that springs in from the ReconnectBubble's screen position using a `translateX` animation with `useNativeDriver: true`. It auto-dismisses after 3 seconds and is debounced so rapid taps only show one toast.

Screens with offline guards: AssetTypesScreen, EmployeeFieldsScreen, InventoryScreen, TransferScreen, AssetDetailScreen, EmployeeDetailScreen.

Cached list data remains visible while offline. Read operations are unaffected.

---

## Theming System

`getColors(theme, accentColor)` in `src/constants/App.js` returns the full color palette. Every screen reads theme and accentColor from the Zustand store and calls `getColors()` to get its colors.

**Light mode** — `rgb(245, 235, 226)` peach backgrounds, `rgb(21, 32, 54)` navy text.  
**Dark mode** — `#0a0a0f` backgrounds, white text.

`userInterfaceStyle` is locked to `"light"` in `app.json` to prevent the OS from interfering with the app's theme system.

Theme transitions use a flash overlay + `themeTransitionRef` callback for an instant smooth switch.

### Accent Colors

| Name | Hex |
|---|---|
| Violet Purple | `#8B5CF6` |
| Electric Blue | `#3B82F6` |
| Emerald Green | `#10B981` |
| Coral Red | `#F43F5E` |
| Amber Gold | `#F59E0B` |
| Cyan Teal | `#06B6D4` |
| Rose Pink | `#EC4899` |
| Slate White | `#E2E8F0` |

---

## Animation Guidelines

All animations use React Native's `Animated` API with `useNativeDriver: true` so they run entirely on the GPU thread.

**Rules:**
1. Every `Animated.timing` and `Animated.spring` must have `useNativeDriver: true`
2. Only `transform` and `opacity` can use the native driver — never animate `width`, `height`, `padding`, or `backgroundColor`
3. Never put SVG inside an `Animated.View` — SVG cannot use the native driver
4. No bouncy springs — always use `damping: 20, stiffness: 180, overshootClamping: true`

**Standard spring:**
```javascript
Animated.spring(value, {
  toValue: 1,
  damping: 20,
  stiffness: 180,
  overshootClamping: true,
  useNativeDriver: true,
}).start();
```

**Standard timing:**
```javascript
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
  useNativeDriver: true,
}).start();
```

---

## Caching

List data is cached to AsyncStorage with a 1-hour TTL. On screen load, cached data appears immediately while a background fetch runs for fresh data.

Cache keys are defined in `src/constants/config.js` under `STORAGE_KEYS`.

Pull-to-refresh bypasses cache and forces a fresh fetch.

A "Viewing cached data" banner appears when the app is offline and displaying stale data.

---

## Building the APK

### Prerequisites
```bash
npm install -g eas-cli
eas login   # use mazinxperia account
```

### Build
```bash
cd ~/Documents/IT-ASSETS-MOBILE/mobile
git add -A && git commit -m "your message"
eas build -p android --profile preview
```

Download the APK from the EAS dashboard and install directly on device.

### Key app.json settings

```json
{
  "expo": {
    "name": "AssetFlow",
    "slug": "assetflow",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": false,
    "android": {
      "package": "com.assetflow.mobile"
    },
    "plugins": [
      "expo-font",
      "expo-asset",
      ["expo-build-properties", { "android": { "usesCleartextTraffic": true } }]
    ],
    "extra": {
      "eas": { "projectId": "a4d73455-045f-47a8-8446-5b67454049e5" }
    },
    "owner": "mazinxperia"
  }
}
```

`usesCleartextTraffic: true` must be set via the `expo-build-properties` plugin (not directly under `android{}`). This is required for HTTP connections to local network backends.

`newArchEnabled: false` is required — Reanimated is not compatible with the new React Native architecture in this setup.

---

## Role-Based Access

| Feature | SUPER_ADMIN | ADMIN | USER |
|---|---|---|---|
| View all screens | ✅ | ✅ | ✅ |
| Add / Edit assets, employees, subscriptions | ✅ | ✅ | ❌ |
| Delete assets, employees, subscriptions | ✅ | ✅ | ❌ |
| Manage asset types / employee fields | ✅ | ✅ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| Change settings | ✅ | ✅ | ✅ |

---

## How to Make Changes

### Adding a new screen

1. Create `src/screens/main/NewScreen.js`
2. Register it in `AssetsStack.js` (or `MainTabs.js` for a new tab)
3. Standard template:

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useAppStore from '../../store/useAppStore';
import { getColors, FONTS } from '../../constants/App';

const NewScreen = ({ navigation }) => {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const isConnected = useAppStore((s) => s.isConnected);
  const showOfflineError = useAppStore((s) => s.showOfflineError);
  const colors = getColors(theme, accentColor);

  const handleWrite = () => {
    if (!isConnected) { showOfflineError(); return; }
    // API call here
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text, fontFamily: FONTS.bold }}>New Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default NewScreen;
```

### Adding a new API call

```javascript
// in src/services/api.js
export const myApi = {
  list: () => api.get('/api/my-resource'),
  create: (data) => api.post('/api/my-resource', data),
  update: (id, data) => api.put(`/api/my-resource/${id}`, data),
  delete: (id) => api.delete(`/api/my-resource/${id}`),
};
```

### Adding an offline guard

```javascript
const isConnected = useAppStore((s) => s.isConnected);
const showOfflineError = useAppStore((s) => s.showOfflineError);

const handleSave = () => {
  if (!isConnected) { showOfflineError(); return; }
  // proceed
};
```

### Changing theme colors

Edit `src/constants/App.js`:
- `DARK_COLORS` — dark mode palette
- `LIGHT_COLORS` — light mode palette

### Adding an accent color

Edit `ACCENT_LIST` in `src/constants/App.js`:
```javascript
{ key: 'myColor', label: 'My Color', hex: '#RRGGBB' }
```

---

## Troubleshooting

**Black screen on launch**  
`newArchEnabled` must be `false` in `app.json`.

**Cannot connect to backend**  
URL must start with `http://`. Phone and server must be on same WiFi. Backend must have a `GET /health` endpoint. `usesCleartextTraffic` must be enabled.

**App hangs on boot splash**  
Font load timeout is 4 seconds — app proceeds automatically. Clear Expo cache: `npx expo start --clear`

**Fonts missing in APK**  
Ensure fonts are loaded via `expo-font` and the `expo-font` plugin is in `app.json` plugins.

**Metro errors**  
```bash
npx expo start --clear
```

**EAS build fails**  
```bash
npx expo-doctor
npx expo install --fix
```

**Works in Expo Go, crashes in APK**  
Run `npx expo-doctor`. Common causes: incompatible package versions, `newArchEnabled: true`, missing `usesCleartextTraffic`.

**Animations laggy in APK**  
All `Animated` calls need `useNativeDriver: true`. Animations touching layout properties (`width`, `height`) cannot use the native driver — restructure to animate only `transform` and `opacity`.

---

**AssetFlow Mobile v1.0.0 — React Native + Expo — Internal Distribution**
