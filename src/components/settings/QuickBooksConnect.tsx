'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle, AlertCircle, RefreshCw, Unlink, ExternalLink,
  Users, Package, FileText, UserCheck, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';

interface ConnectionStatus {
  connected: boolean;
  connection: {
    realm_id: string;
    connected_at: string;
    last_synced_at: string | null;
    expires_at: string;
  } | null;
}

interface SyncResult {
  success: boolean;
  synced: Record<string, number>;
  synced_at: string;
  error?: string;
}

const SYNC_ENTITIES = [
  { key: 'employees', label: 'Sales Reps / Employees', icon: UserCheck, color: 'text-blue-600' },
  { key: 'items', label: 'Products & Items', icon: Package, color: 'text-violet-600' },
  { key: 'customers', label: 'Customers', icon: Users, color: 'text-emerald-600' },
  { key: 'invoices', label: 'Invoices & Line Items', icon: FileText, color: 'text-amber-600' },
];

export default function QuickBooksConnect() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>(['employees', 'items', 'customers', 'invoices']);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchStatus();

    // Handle OAuth callback result
    const qboParam = searchParams.get('qbo');
    if (qboParam === 'connected') {
      setNotification({ type: 'success', message: 'QuickBooks connected successfully!' });
    } else if (qboParam === 'denied') {
      setNotification({ type: 'error', message: 'QuickBooks authorization was cancelled.' });
    } else if (qboParam === 'error') {
      const msg = searchParams.get('msg') || 'Connection failed';
      setNotification({ type: 'error', message: `Connection failed: ${msg}` });
    }
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/intuit/sync');
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, connection: null });
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncProgress(10);
    setSyncResult(null);

    try {
      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setSyncProgress((p) => Math.min(p + 15, 85));
      }, 600);

      const res = await fetch('/api/intuit/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entities: selectedEntities }),
      });

      clearInterval(progressInterval);
      setSyncProgress(100);

      const data = await res.json();
      setSyncResult(data);

      if (data.success) {
        await fetchStatus();
      }
    } catch (err: any) {
      setSyncResult({ success: false, synced: {}, synced_at: '', error: err.message });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect QuickBooks? Your existing synced data will remain in the dashboard.')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/intuit/disconnect', { method: 'POST' });
      await fetchStatus();
      setSyncResult(null);
    } finally {
      setDisconnecting(false);
    }
  }

  const toggleEntity = (key: string) => {
    setSelectedEntities((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  if (!status) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {notification.message}
          <button className="ml-auto text-current opacity-60 hover:opacity-100" onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Connection Status */}
      <div className={`rounded-xl border p-5 ${
        status.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* QuickBooks logo placeholder */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2CA01C] text-white font-bold text-sm">
              QB
            </div>
            <div>
              <p className="font-semibold text-gray-900">QuickBooks Online</p>
              {status.connected && status.connection ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500">
                    Company ID: {status.connection.realm_id}
                  </p>
                  <Badge variant="success" className="text-[10px]">Connected</Badge>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Not connected</p>
              )}
            </div>
          </div>

          {status.connected ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Unlink className="h-3.5 w-3.5 mr-1" />}
                Disconnect
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild className="bg-[#2CA01C] hover:bg-[#228B17] text-white text-xs">
              <a href="/api/intuit/auth">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Connect QuickBooks
              </a>
            </Button>
          )}
        </div>

        {status.connected && status.connection && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-500">Connected</p>
              <p className="font-medium text-gray-700">{formatDate(status.connection.connected_at)}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Synced</p>
              <p className="font-medium text-gray-700">
                {status.connection.last_synced_at
                  ? formatDate(status.connection.last_synced_at)
                  : 'Never'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sync Controls */}
      {status.connected && (
        <>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select data to sync:</p>
            <div className="grid grid-cols-2 gap-2">
              {SYNC_ENTITIES.map((entity) => {
                const Icon = entity.icon;
                const selected = selectedEntities.includes(entity.key);
                return (
                  <button
                    key={entity.key}
                    onClick={() => toggleEntity(entity.key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      selected
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="text-xs font-medium">{entity.label}</span>
                    {selected && <CheckCircle className="h-3.5 w-3.5 ml-auto text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {syncing && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Syncing from QuickBooks...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSync}
            disabled={syncing || selectedEntities.length === 0}
          >
            {syncing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Sync Now</>
            )}
          </Button>

          {/* Sync Results */}
          {syncResult && (
            <div className={`rounded-lg border p-4 ${
              syncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              {syncResult.success ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">Sync completed successfully</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(syncResult.synced).map(([key, count]) => (
                      <div key={key} className="flex items-center justify-between rounded-md bg-white px-3 py-2">
                        <span className="text-xs text-gray-600 capitalize">{key}</span>
                        <Badge variant="success" className="text-xs">{count} synced</Badge>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{syncResult.error || 'Sync failed'}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Setup Help */}
      {!status.connected && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 space-y-1.5">
          <p className="font-semibold">Setup checklist:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-600">
            <li>Go to <strong>developer.intuit.com</strong> and create an app</li>
            <li>Set redirect URI to <code className="bg-blue-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}/api/intuit/callback</code></li>
            <li>Add <code className="bg-blue-100 px-1 rounded">INTUIT_CLIENT_ID</code> and <code className="bg-blue-100 px-1 rounded">INTUIT_CLIENT_SECRET</code> to your <code>.env.local</code></li>
            <li>Click "Connect QuickBooks" above</li>
          </ol>
        </div>
      )}
    </div>
  );
}
