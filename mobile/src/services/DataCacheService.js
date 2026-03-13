import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardApi, assetsApi, employeesApi, transfersApi, subscriptionsApi, assetTypesApi, settingsApi } from './api';

export const CK = {
  DASHBOARD: '@af_cache_dashboard',
  ASSETS: '@af_cache_assets',
  EMPLOYEES: '@af_cache_employees',
  TRANSFERS: '@af_cache_transfers',
  SUBSCRIPTIONS: '@af_cache_subscriptions',
  ASSET_TYPES: '@af_cache_asset_types',
  EMP_FIELDS: '@af_cache_emp_fields',
  BRANDING: '@af_cache_branding',
  APP_SETTINGS: '@af_cache_app_settings',
};

const _mem = {};

const _write = async (key, value) => {
  _mem[key] = value;
  try { await AsyncStorage.setItem(key, JSON.stringify({ v: value, t: Date.now() })); } catch {}
};

const _read = async (key) => {
  if (_mem[key] !== undefined) return _mem[key];
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { v } = JSON.parse(raw);
    _mem[key] = v;
    return v;
  } catch { return null; }
};

const _del = async (key) => {
  delete _mem[key];
  try { await AsyncStorage.removeItem(key); } catch {}
};

const FETCHERS = {
  [CK.DASHBOARD]: () => dashboardApi.stats(),
  [CK.ASSETS]: () => assetsApi.list(),
  [CK.EMPLOYEES]: () => employeesApi.list(),
  [CK.TRANSFERS]: () => transfersApi.list(),
  [CK.SUBSCRIPTIONS]: () => subscriptionsApi.list(),
  [CK.ASSET_TYPES]: () => assetTypesApi.list(),
  [CK.EMP_FIELDS]: () => settingsApi.employeeFields(),
  [CK.BRANDING]: () => settingsApi.branding(),
  [CK.APP_SETTINGS]: () => settingsApi.app(),
};

let _refreshTimer = null;

const _fetchOne = async (key) => {
  try {
    const res = await FETCHERS[key]();
    const value = res?.data ?? res;
    await _write(key, value);
    return value;
  } catch { return await _read(key); }
};

export const prefetchAll = async () => {
  await Promise.allSettled(Object.keys(FETCHERS).map(_fetchOne));
};

export const getCached = async (key) => {
  const cached = await _read(key);
  if (cached !== null) return cached;
  return await _fetchOne(key);
};

export const invalidate = async (...keys) => {
  await Promise.allSettled(keys.map(async (key) => { await _del(key); await _fetchOne(key); }));
};

export const startBackgroundRefresh = () => {
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(() => { prefetchAll(); }, 5 * 60 * 1000);
};

export const stopBackgroundRefresh = () => {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
};

export const clearAllCache = async () => {
  stopBackgroundRefresh();
  await Promise.allSettled(Object.values(CK).map(_del));
};
