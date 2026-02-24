import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function DateTimeSettings() {
  const [liveTime, setLiveTime] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const offsetRef = useRef(0);
  const tickRef = useRef(null);

  const startTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setLiveTime(new Date(Date.now() + offsetRef.current));
    }, 1000);
  }, []);

  const syncTime = useCallback(async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    try {
      // Step 1: Auto-detect timezone from IP location
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      const detectedTimezone = ipData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = ipData.city || '';
      const country = ipData.country_name || '';
      setLocationInfo({ timezone: detectedTimezone, city, country });

      // Step 2: Get accurate internet time for that timezone
      const tzEncoded = encodeURIComponent(detectedTimezone);
      const before = Date.now();
      const timeRes = await fetch(`https://worldtimeapi.org/api/timezone/${tzEncoded}`);
      const after = Date.now();

      if (!timeRes.ok) throw new Error('Time API failed');
      const timeData = await timeRes.json();

      const internetMs = new Date(timeData.datetime).getTime();
      const latency = (after - before) / 2;
      offsetRef.current = internetMs + latency - Date.now();

      setLiveTime(new Date(Date.now() + offsetRef.current));
      setLastSynced(new Date());
      setSyncStatus('success');
      startTick();
    } catch {
      // Fallback to browser timezone + system clock
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setLocationInfo({ timezone: tz, city: '', country: '' });
      } catch {}
      offsetRef.current = 0;
      setLiveTime(new Date());
      setSyncStatus('error');
      startTick();
    } finally {
      setSyncing(false);
    }
  }, [startTick]);

  // Auto-sync every time page opens
  useEffect(() => {
    syncTime();
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [syncTime]);

  const fmt = (date, opts) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: locationInfo?.timezone || 'UTC',
        ...opts,
      }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-US', opts).format(date);
    }
  };

  const timeStr = fmt(liveTime, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = fmt(liveTime, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const lastSyncedStr = lastSynced
    ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(lastSynced)
    : '';

  const timeParts = timeStr.split(' ');
  const ampm = timeParts.length > 1 ? timeParts[timeParts.length - 1] : '';
  const clockDigits = timeParts.length > 1 ? timeParts.slice(0, -1).join(' ') : timeStr;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Current Date &amp; Time
              </CardTitle>
              <CardDescription>
                Automatically synced from the internet based on your network location
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...
                </span>
              )}
              {syncStatus === 'success' && (
                <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Synced
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5" /> System clock
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Clock Display */}
          <div className="flex flex-col items-center justify-center py-8 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-end gap-3">
              <span className="font-mono text-6xl font-bold tracking-tight text-foreground tabular-nums">
                {clockDigits}
              </span>
              {ampm && (
                <span className="font-mono text-2xl font-semibold text-muted-foreground mb-2">
                  {ampm}
                </span>
              )}
            </div>

            <div className="mt-3 text-base text-muted-foreground font-medium">
              {dateStr}
            </div>

            {locationInfo && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>
                  {[locationInfo.city, locationInfo.country].filter(Boolean).join(', ')}
                  {locationInfo.timezone && (
                    <span className="ml-1 opacity-70">({locationInfo.timezone})</span>
                  )}
                </span>
              </div>
            )}

            {lastSynced && syncStatus === 'success' && (
              <div className="mt-1.5 text-xs text-muted-foreground opacity-60">
                Last synced at {lastSyncedStr}
              </div>
            )}
          </div>

          {/* Sync Now Button */}
          <Button onClick={syncTime} disabled={syncing} className="w-full" variant="outline">
            {syncing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Syncing with internet...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Sync Now</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Timezone and time are automatically detected from your network location and synced from{' '}
            <span className="font-medium">worldtimeapi.org</span> every time you open this page.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
