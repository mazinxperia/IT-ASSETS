// App configuration constants

export const STORAGE_KEYS = {
  BACKEND_URL: '@assetflow_backend_url',
  TOKEN: '@assetflow_token',
  USER: '@assetflow_user',
  ONBOARDING_COMPLETE: '@assetflow_onboarding_complete',
  THEME: '@assetflow_theme',
  ACCENT_COLOR: '@assetflow_accent_color',
  SHOW_CONNECTION_BUBBLE: '@assetflow_show_bubble',
  // Cache keys
  CACHE_DASHBOARD: '@cache_dashboard',
  CACHE_ASSETS: '@cache_assets',
  CACHE_EMPLOYEES: '@cache_employees',
  CACHE_SUBSCRIPTIONS: '@cache_subscriptions',
  CACHE_TRANSFERS: '@cache_transfers',
  CACHE_ASSET_TYPES: '@cache_asset_types',
};

export const BACKEND_TYPES = [
  {
    key: 'local',
    label: 'Local Network (PC)',
    description: 'Running on your local machine',
    placeholder: 'http://192.168.1.x:8001',
    example: 'http://192.168.1.100:8001',
  },
  {
    key: 'online',
    label: 'Online Deployed',
    description: 'Deployed to cloud/hosting',
    placeholder: 'https://your-app.example.com',
    example: 'https://assetflow.example.com',
  },
  {
    key: 'vps',
    label: 'VPS / Server',
    description: 'Private server or VPS',
    placeholder: 'http://your-server-ip:8001',
    example: 'http://123.456.789.0:8001',
  },
];

export const CACHE_TTL = 3600000; // 1 hour in ms

export const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const ANIMATION = {
  // Material Design standard easing
  easing: { bezier: [0.4, 0, 0.2, 1] },
  // Duration presets
  fast: 150,
  normal: 250,
  slow: 400,
  // Stagger
  listItemDelay: 30,
  listItemDuration: 200,
  // Button press
  buttonScale: 0.97,
  buttonDuration: 100,
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
};

export const ASSET_STATUS = {
  ACTIVE: 'Active',
  UNDER_REPAIR: 'Under Repair',
  RETIRED: 'Retired',
};
