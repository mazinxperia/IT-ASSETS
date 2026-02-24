import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { settingsAPI } from '../../services/api';
import { toast } from 'sonner';

export function SMTPSettings() {
  const [settings, setSettings] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    encryption: 'TLS'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  // gray = not configured, green = connected, red = failed
  const [connectionStatus, setConnectionStatus] = useState('gray');

  const autoTest = useCallback(async () => {
    if (!settings.host || !settings.username) {
      setConnectionStatus('gray');
      return;
    }
    
    setTesting(true);
    try {
      const response = await settingsAPI.testSMTP();
      const result = response.data;
      setConnectionStatus(result.status === 'connected' ? 'green' : 'red');
    } catch (error) {
      setConnectionStatus('red');
    } finally {
      setTesting(false);
    }
  }, [settings.host, settings.username]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Auto-test when settings are loaded and configured
  useEffect(() => {
    if (!loading && settings.host && settings.username) {
      autoTest();
    }
  }, [loading, autoTest, settings.host, settings.username]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSMTP();
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      toast.error('Failed to load SMTP settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSMTP(settings);
      toast.success('SMTP settings saved successfully');
      // Re-test after saving
      await autoTest();
    } catch (error) {
      toast.error('Failed to save SMTP settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualTest = async () => {
    setTesting(true);
    try {
      const response = await settingsAPI.testSMTP();
      const result = response.data;
      setConnectionStatus(result.status === 'connected' ? 'green' : 'red');
      if (result.status === 'connected') {
        toast.success('SMTP connection successful!');
      } else {
        toast.error(`Connection failed: ${result.message}`);
      }
    } catch (error) {
      setConnectionStatus('red');
      toast.error('Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (testing) {
      return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    }
    switch (connectionStatus) {
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'red':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (testing) return 'Testing...';
    switch (connectionStatus) {
      case 'green':
        return 'Connected';
      case 'red':
        return 'Not Connected';
      default:
        return 'Not Configured';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'green':
        return 'text-green-500';
      case 'red':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure email settings for password resets and notifications
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                placeholder="Enter SMTP host"
                value={settings.host}
                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                placeholder="Enter port number"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-username">Username</Label>
            <Input
              id="smtp-username"
              placeholder="Enter username or email"
              value={settings.username}
              onChange={(e) => setSettings({ ...settings, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-password">Password</Label>
            <Input
              id="smtp-password"
              type="password"
              placeholder="Enter password"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-from">From Email</Label>
            <Input
              id="smtp-from"
              type="email"
              placeholder="Enter sender email address"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="smtp-encryption">Encryption</Label>
            <Select value={settings.encryption} onValueChange={(value) => setSettings({ ...settings, encryption: value })}>
              <SelectTrigger id="smtp-encryption">
                <SelectValue placeholder="Select encryption" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TLS">TLS (587)</SelectItem>
                <SelectItem value="SSL">SSL (465)</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={handleManualTest} disabled={testing || !settings.host}>
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
