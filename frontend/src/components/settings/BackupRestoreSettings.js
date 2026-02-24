import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, CheckCircle, XCircle, Loader2,
  AlertTriangle, HardDrive, Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import api from '../../services/api';
import { toast } from 'sonner';

const BACKUP_CATEGORIES = [
  { id: 'employees', label: 'Employees', description: 'All employee records and custom field values' },
  { id: 'assets', label: 'Assets', description: 'All assets and their field values' },
  { id: 'transfers', label: 'Transfer Logs', description: 'Complete transfer history' },
  { id: 'subscriptions', label: 'Subscriptions', description: 'Subscription tracker data' },
  { id: 'asset_types', label: 'Asset Field Settings', description: 'Asset types and their custom fields' },
  { id: 'employee_fields', label: 'Employee Field Settings', description: 'Employee custom field definitions' },
  { id: 'users', label: 'User Accounts', description: 'All user accounts (passwords excluded)' },
  { id: 'settings', label: 'App Settings & Branding', description: 'SMTP, Monday.com, branding, personalization' },
];

function StatusBar({ status, message, detail }) {
  if (!status) return null;
  const colors = {
    loading: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-600 dark:text-yellow-400',
    success: 'bg-green-500/15 border-green-500/40 text-green-600 dark:text-green-400',
    error: 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400',
  };
  const icons = {
    loading: <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />,
    success: <CheckCircle className="w-4 h-4 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 flex-shrink-0" />,
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm font-medium ${colors[status]}`}
    >
      {icons[status]}
      <div>
        <div>{message}</div>
        {detail && <div className="text-xs font-normal mt-0.5 opacity-80">{detail}</div>}
      </div>
    </motion.div>
  );
}

export function BackupRestoreSettings() {
  const [selectAll, setSelectAll] = useState(true);
  const [selected, setSelected] = useState(BACKUP_CATEGORIES.map(c => c.id));
  const [backupStatus, setBackupStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [backupMsg, setBackupMsg] = useState('');
  const [backupDetail, setBackupDetail] = useState('');
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState('');
  const [restoreDetail, setRestoreDetail] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const fileInputRef = React.useRef();

  const toggleCategory = (id) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectAll(next.length === BACKUP_CATEGORIES.length);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(BACKUP_CATEGORIES.map(c => c.id));
      setSelectAll(true);
    }
  };

  const handleBackup = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one category to backup');
      return;
    }
    setBackupStatus('loading');
    setBackupMsg('Collecting data...');
    setBackupDetail('');
    try {
      const res = await api.post('/api/backup/create', { categories: selected }, { responseType: 'blob' });
      
      // Read how many records backed up from header
      const meta = res.headers['x-backup-meta'];
      let detail = '';
      if (meta) {
        try {
          const parsed = JSON.parse(meta);
          detail = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
        } catch {}
      }

      setBackupStatus('success');
      setBackupMsg('Backup created successfully!');
      setBackupDetail(detail || `${selected.length} categories backed up`);

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `assetflow_backup_${new Date().toISOString().slice(0, 10)}.assetflow`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setBackupStatus('error');
      setBackupMsg('Backup failed');
      setBackupDetail(err?.response?.data?.detail || err.message || 'Unknown error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.assetflow')) {
      toast.error('Please upload a valid .assetflow backup file');
      return;
    }
    setRestoreFile(file);
    setRestoreStatus(null);
    setRestoreMsg('');
    setRestoreDetail('');
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error('Please select a backup file first');
      return;
    }
    setRestoreStatus('loading');
    setRestoreMsg('Reading backup file...');
    setRestoreDetail('');

    try {
      const text = await restoreFile.text();
      const backup = JSON.parse(text);

      setRestoreMsg('Restoring data...');

      const res = await api.post('/api/backup/restore', backup);
      const { restored } = res.data;
      const detail = Object.entries(restored || {}).map(([k, v]) => `${k}: ${v}`).join(', ');

      setRestoreStatus('success');
      setRestoreMsg('Restore completed successfully!');
      setRestoreDetail(detail || 'All data restored');
      toast.success('Restore complete! Please refresh the page.');
    } catch (err) {
      setRestoreStatus('error');
      setRestoreMsg('Restore failed');
      setRestoreDetail(
        err?.response?.data?.detail ||
        (err.message === 'Unexpected token' ? 'Invalid backup file format' : err.message) ||
        'Unknown error'
      );
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Backup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Backup
          </CardTitle>
          <CardDescription>
            Download a backup file of your AssetFlow data. The file can be used to restore your system later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Select All */}
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Checkbox
              id="select-all"
              checked={selectAll}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer">
              Select All Categories
            </Label>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {BACKUP_CATEGORIES.map(cat => (
              <div key={cat.id} className="flex items-start gap-3">
                <Checkbox
                  id={`cat-${cat.id}`}
                  checked={selected.includes(cat.id)}
                  onCheckedChange={() => toggleCategory(cat.id)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor={`cat-${cat.id}`} className="text-sm font-medium cursor-pointer">
                    {cat.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <StatusBar status={backupStatus} message={backupMsg} detail={backupDetail} />

          <Button
            onClick={handleBackup}
            disabled={backupStatus === 'loading' || selected.length === 0}
            className="w-full"
          >
            {backupStatus === 'loading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Backup...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Download Backup</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restore
          </CardTitle>
          <CardDescription>
            Upload a previously downloaded <code className="text-xs bg-muted px-1 py-0.5 rounded">.assetflow</code> backup file to restore your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Warning */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Restoring will <strong>overwrite existing data</strong> for the categories included in the backup file. This cannot be undone.</span>
          </div>

          {/* File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/60 hover:bg-accent/30 transition-all cursor-pointer"
          >
            <HardDrive className="w-8 h-8 text-muted-foreground" />
            {restoreFile ? (
              <>
                <p className="text-sm font-medium text-foreground">{restoreFile.name}</p>
                <p className="text-xs text-muted-foreground">{(restoreFile.size / 1024).toFixed(1)} KB — Click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Click to upload backup file</p>
                <p className="text-xs text-muted-foreground">Only .assetflow files accepted</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".assetflow"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Status */}
          <StatusBar status={restoreStatus} message={restoreMsg} detail={restoreDetail} />

          <Button
            onClick={handleRestore}
            disabled={!restoreFile || restoreStatus === 'loading'}
            variant="outline"
            className="w-full"
          >
            {restoreStatus === 'loading' ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Restoring...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" />Restore from Backup</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4" />
            How Backup &amp; Restore Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Backup creates a <code className="bg-muted px-1 rounded">.assetflow</code> file (JSON format) containing all selected data.</p>
          <p>• The file is safe to store on your computer, cloud drive, or email to yourself.</p>
          <p>• To restore: upload the <code className="bg-muted px-1 rounded">.assetflow</code> file using the Restore section above.</p>
          <p>• <strong>Do not modify</strong> the backup file manually — a corrupted file will fail to restore.</p>
          <p>• Passwords for user accounts are <strong>never</strong> included in backups for security reasons.</p>
          <p>• Images and branding files are included as base64 encoded data in the backup.</p>
        </CardContent>
      </Card>

    </motion.div>
  );
}
