import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Server, CheckCircle, XCircle, Loader2, RefreshCw, Clock, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { settingsAPI } from '../../services/api';
import { toast } from 'sonner';

export function DatabaseStatusSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await settingsAPI.getDatabaseStatus();
      setStatus(response.data);
    } catch (error) {
      setStatus({
        status: 'disconnected',
        databaseType: 'MongoDB',
        error: 'Failed to fetch status'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await settingsAPI.testDatabaseConnection();
      if (response.data.status === 'connected') {
        toast.success(`Connection successful (${response.data.latencyMs}ms)`);
      } else {
        toast.error(`Connection failed: ${response.data.message}`);
      }
      await fetchStatus();
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const isConnected = status?.status === 'connected';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
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
                <Server className="w-5 h-5" />
                Database Status
              </CardTitle>
              <CardDescription>
                Real-time database connection monitoring (view-only)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Type */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4" />
                Database Type
              </div>
              <p className="font-medium">{status?.databaseType || 'Unknown'}</p>
            </div>

            {/* Version */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="w-4 h-4" />
                Version
              </div>
              <p className="font-medium">{status?.version || 'N/A'}</p>
            </div>

            {/* Database Name */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
              <div className="text-sm text-muted-foreground">Database Name</div>
              <p className="font-medium font-mono">{status?.databaseName || 'N/A'}</p>
            </div>

            {/* Latency */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Latency
              </div>
              <p className="font-medium">
                {status?.latencyMs !== undefined ? `${status.latencyMs}ms` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Connection String (Masked) */}
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <div className="text-sm text-muted-foreground">Connection String</div>
            <p className="font-mono text-sm break-all">
              {status?.connectionString || '****'}
            </p>
          </div>

          {/* Error Message if any */}
          {status?.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
              <div className="text-sm font-medium text-destructive">Error</div>
              <p className="text-sm text-destructive/80">{status.error}</p>
            </div>
          )}

          {/* Test Connection Button */}
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Status auto-refreshes every 30 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
