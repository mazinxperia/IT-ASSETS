import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Users, Package, ArrowLeftRight, Image, AlertTriangle, ShieldAlert, CheckCircle2, Database, HardDrive, RefreshCw, FileImage, CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import api from '../../services/api';
import { toast } from 'sonner';

const clearOptions = [
  { id: 'employees', label: 'Clear Employee List', description: 'Delete all employees. Assets will be unassigned but kept.', icon: Users, color: '#3b82f6', endpoint: '/api/clear/employees' },
  { id: 'assets', label: 'Clear All Assets', description: 'Delete all assets and their transfer history permanently.', icon: Package, color: '#f59e0b', endpoint: '/api/clear/assets' },
  { id: 'transfers', label: 'Clear Transfer History', description: 'Delete all transfer logs. Assets and employees not affected.', icon: ArrowLeftRight, color: '#8b5cf6', endpoint: '/api/clear/transfers' },
  { id: 'branding-images', label: 'Clear Branding Images', description: 'Remove logo, login background, and favicon. App name kept.', icon: Image, color: '#10b981', endpoint: '/api/clear/branding-images' },
  { id: 'cache', label: 'Clear Browser Cache', description: 'Clear local storage and session storage, then reload the app.', icon: AlertTriangle, color: '#06b6d4', endpoint: null },
  { id: 'subscriptions', label: 'Clear Subscriptions', description: 'Delete all subscriptions and their logo files.', icon: CreditCard, color: '#06b6d4', endpoint: '/api/clear/subscriptions' },
  { id: 'all', label: 'Clear ALL Data', description: 'Wipe everything — employees, assets, transfers, asset types, subscriptions, branding images. Cannot be undone.', icon: ShieldAlert, color: '#f43f5e', endpoint: '/api/clear/all', danger: true },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StorageBar({ label, count, size, color, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-xs text-muted-foreground">{count} records</span>
            <span className="font-medium text-xs">{formatBytes(size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StorageCard({ refreshKey, onRefresh }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/api/clear/storage-stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const collectionIcons = {
    employees: Users,
    assets: Package,
    transfers: ArrowLeftRight,
    asset_types: Database,
    users: Users,
    files: FileImage,
    subscriptions: CreditCard,
  };
  const collectionColors = {
    employees: '#3b82f6',
    assets: '#f59e0b',
    transfers: '#8b5cf6',
    asset_types: '#10b981',
    users: '#f43f5e',
    files: '#a855f7',
    subscriptions: '#06b6d4',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="w-4 h-4 text-primary" />
              Database Storage
            </CardTitle>
            <CardDescription className="mt-1">Current usage across all collections</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-1">
            {/* Storage size summary */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Actual Data</div>
                <div className="text-2xl font-bold">{formatBytes(stats.dataSize)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-0.5">Allocated (Atlas)</div>
                <div className="text-2xl font-bold">{formatBytes(stats.storageSize)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">pre-allocated by MongoDB</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-0.5">Total Records</div>
                <div className="text-2xl font-bold">{stats.objects}</div>
              </div>
            </div>

            {/* Per collection */}
            <div className="divide-y divide-border">
              {Object.entries(stats.collections || {}).map(([key, val]) => (
                <StorageBar
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  count={typeof val === 'object' ? val.count : val}
                  size={typeof val === 'object' ? val.size : 0}
                  color={collectionColors[key] || '#888'}
                  icon={collectionIcons[key] || Database}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-6">Could not load storage stats</div>
        )}

        {/* Windows Explorer style available/used bar */}
        {stats && (() => {
          const FREE_TIER_BYTES = 512 * 1024 * 1024; // 512 MB (MongoDB Atlas M0 free tier)
          const used = stats.storageSize || 0;
          const total = FREE_TIER_BYTES;
          const available = Math.max(total - used, 0);
          const usedPercent = Math.min((used / total) * 100, 100);
          const isHigh = usedPercent > 80;
          const isMedium = usedPercent > 50;
          const barColor = isHigh ? '#f43f5e' : isMedium ? '#f59e0b' : '#3b82f6';

          return (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Storage (Free Tier)</span>
                <span className="text-xs text-muted-foreground">{usedPercent.toFixed(1)}% used</span>
              </div>

              {/* Fill bar */}
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2.5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${usedPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              {/* Used / Available labels */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: barColor }} />
                  <span className="text-muted-foreground">{formatBytes(used)} used</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-muted-foreground/30" />
                  <span className="text-muted-foreground">{formatBytes(available)} free of {formatBytes(total)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}

export function ClearDataSettings() {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [loading, setLoading] = useState(null);
  const [done, setDone] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClear = async (option) => {
    setLoading(option.id);
    setConfirmDialog(null);
    try {
      if (option.id === 'cache') {
        localStorage.clear();
        sessionStorage.clear();
        toast.success('Browser cache cleared — reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        await api.delete(option.endpoint);
        setDone(prev => ({ ...prev, [option.id]: true }));
        toast.success(option.label + ' completed');
        // Refresh storage stats after a clear
        setRefreshKey(k => k + 1);
        setTimeout(() => setDone(prev => ({ ...prev, [option.id]: false })), 3000);
        if (option.id === 'all') {
          localStorage.clear();
          sessionStorage.clear();
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch (err) {
      toast.error('Failed: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Danger warning */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and cannot be undone. Make sure you have a backup before proceeding.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Clear options */}
      <div className="grid grid-cols-1 gap-3">
        {clearOptions.map((option, i) => {
          const Icon = option.icon;
          const isLoading = loading === option.id;
          const isDone = done[option.id];
          return (
            <motion.div key={option.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={option.danger ? 'border-destructive/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: option.color + '15', border: '1px solid ' + option.color + '30' }}>
                        <Icon className="w-5 h-5" style={{ color: option.color }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-sm">{option.description}</div>
                      </div>
                    </div>
                    <Button variant={option.danger ? 'destructive' : 'outline'} size="sm"
                      disabled={isLoading} onClick={() => setConfirmDialog(option)}
                      className="flex-shrink-0 min-w-[90px] gap-1.5">
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isDone ? (
                          <motion.div key="d" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-green-500 text-xs">Done</span>
                          </motion.div>
                        ) : (
                          <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Storage stats - refreshes after any clear action */}
      <StorageCard refreshKey={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              {confirmDialog?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.description}
              <br /><br />
              <strong className="text-destructive">This cannot be undone.</strong> Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClear(confirmDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, Clear It
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
