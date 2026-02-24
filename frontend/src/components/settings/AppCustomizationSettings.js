import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useTheme } from '../../context/ThemeContext';
import { settingsAPI } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Blue', value: '#3B82F6' },
];

// Convert hex to RGB values for CSS variables
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Apply accent color to CSS variables
function applyAccentColor(hex) {
  const rgb = hexToRgb(hex);
  if (rgb) {
    document.documentElement.style.setProperty('--primary', `${rgb.r} ${rgb.g} ${rgb.b}`);
    document.documentElement.style.setProperty('--ring', `${rgb.r} ${rgb.g} ${rgb.b}`);
    // Store in localStorage for persistence
    localStorage.setItem('assetflow-accent-color', hex);
  }
}

export function AppCustomizationSettings() {
  const { theme, setTheme } = useTheme();
  const [accentColor, setAccentColor] = useState('#4F46E5');
  const [customHex, setCustomHex] = useState('#4F46E5');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const themes = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes' },
  ];

  useEffect(() => {
    // Load saved accent color
    const savedColor = localStorage.getItem('assetflow-accent-color');
    if (savedColor) {
      setAccentColor(savedColor);
      setCustomHex(savedColor);
      applyAccentColor(savedColor);
    }
    
    // Also try to load from API
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await settingsAPI.getAppSettings();
      if (response.data?.accentColor) {
        setAccentColor(response.data.accentColor);
        setCustomHex(response.data.accentColor);
        applyAccentColor(response.data.accentColor);
      }
    } catch (error) {
      // Use localStorage fallback
    } finally {
      setLoading(false);
    }
  }

  const handleColorSelect = (color) => {
    setAccentColor(color);
    setCustomHex(color);
    applyAccentColor(color);
  };

  const handleCustomHexChange = (e) => {
    const value = e.target.value;
    setCustomHex(value);
    
    // Validate and apply if valid hex
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setAccentColor(value);
      applyAccentColor(value);
    }
  };

  const handleColorPickerChange = (e) => {
    const value = e.target.value;
    setAccentColor(value);
    setCustomHex(value);
    applyAccentColor(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateAppSettings({ accentColor });
      toast.success('Appearance settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-heading font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how AssetFlow looks on your device
        </p>
      </div>

      {/* Theme Selection */}
      <Card className="dark:border-border">
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Select your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themes.map(t => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-300",
                    isActive 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                  data-testid={`theme-${t.id}`}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-colors duration-300",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{t.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card className="dark:border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Accent Color
          </CardTitle>
          <CardDescription>
            Primary color for buttons, links, and highlights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Colors */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Preset Colors</Label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center",
                    "hover:scale-110 hover:shadow-lg",
                    accentColor === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  data-testid={`color-${color.name.toLowerCase()}`}
                >
                  {accentColor === color.value && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Custom Color</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-xl border-2 border-border cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: accentColor }}
                >
                  <input
                    type="color"
                    value={accentColor}
                    onChange={handleColorPickerChange}
                    className="w-full h-full cursor-pointer opacity-0"
                    data-testid="color-picker"
                  />
                </div>
              </div>
              <div className="flex-1 max-w-xs">
                <Label htmlFor="hexInput" className="sr-only">Hex Color</Label>
                <Input
                  id="hexInput"
                  value={customHex}
                  onChange={handleCustomHexChange}
                  placeholder="#4F46E5"
                  className="font-mono uppercase"
                  maxLength={7}
                  data-testid="hex-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a hex color code (e.g., #4F46E5)
                </p>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Live Preview</Label>
            <div className="p-6 rounded-xl bg-muted/50 space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold transition-colors duration-300"
                  style={{ backgroundColor: accentColor }}
                >
                  A
                </div>
                <div>
                  <h4 className="font-heading font-semibold">Sample Card</h4>
                  <p className="text-sm text-muted-foreground">This is how text looks</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm transition-colors duration-300"
                  style={{ backgroundColor: accentColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm transition-colors duration-300 border-2"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  Outline Button
                </button>
                <span 
                  className="px-3 py-1 rounded-full text-white text-xs transition-colors duration-300"
                  style={{ backgroundColor: accentColor }}
                >
                  Badge
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: accentColor }}
                />
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full w-2/3 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
                <span className="text-sm" style={{ color: accentColor }}>Progress</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="save-appearance-btn">
          {saving && <LoadingSpinner size="sm" className="mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
