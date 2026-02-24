import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const BrandingContext = createContext(null);
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || '';
const CACHE_KEY = 'assetflow_branding_cache';

const defaultBranding = {
  appName: 'AssetFlow',
  logoUrl: null,
  faviconUrl: null,
  loginTitle: 'Welcome to AssetFlow',
  headerText: 'AssetFlow',
  accentColor: '#4F46E5',
  loginBackgroundUrl: null,
};

function fixUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
}

function applyBrandingToDOM(branding) {
  // Favicon - use a single canonical link tag, update href in place to avoid browser confusion
  let faviconEl = document.querySelector("link#app-favicon");
  if (!faviconEl) {
    // Remove any stale favicon tags first
    document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove());
    faviconEl = document.createElement('link');
    faviconEl.id = 'app-favicon';
    faviconEl.rel = 'icon';
    faviconEl.type = 'image/png';
    document.head.appendChild(faviconEl);
  }
  if (branding.faviconUrl) {
    faviconEl.href = branding.faviconUrl + '?t=' + Date.now();
  }
  // Title
  document.title = branding.appName || 'AssetFlow';
  // Accent color
  if (branding.accentColor) {
    document.documentElement.style.setProperty('--accent-brand', branding.accentColor);
  }
}

export function BrandingProvider({ children }) {
  // Load from cache immediately so UI is instant
  const getCached = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : defaultBranding;
    } catch {
      return defaultBranding;
    }
  };

  const [branding, setBranding] = useState(getCached);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    try {
      const response = await api.get('/api/settings/branding');
      const data = response.data;
      const processed = {
        ...defaultBranding,
        ...data,
        logoUrl: fixUrl(data.logoUrl),
        faviconUrl: fixUrl(data.faviconUrl),
        loginBackgroundUrl: fixUrl(data.loginBackgroundUrl),
      };
      setBranding(processed);
      // Cache for next load
      localStorage.setItem(CACHE_KEY, JSON.stringify(processed));
      applyBrandingToDOM(processed);
    } catch (err) {
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Apply cached branding to DOM immediately
    applyBrandingToDOM(getCached());
    // Then fetch fresh from server
    fetchBranding();
  }, [fetchBranding]);

  const updateBranding = (newBranding) => {
    const updated = { ...branding, ...newBranding };
    setBranding(updated);
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    applyBrandingToDOM(updated);
  };

  return (
    <BrandingContext.Provider value={{ branding, loading, updateBranding, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error('useBranding must be used within a BrandingProvider');
  return context;
}
