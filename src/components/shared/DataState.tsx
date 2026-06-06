'use client';

import Link from 'next/link';
import { Loader2, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataStateProps {
  loading: boolean;
  error: string | null;
  hasLiveData: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataState({ loading, error, hasLiveData, onRetry, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Loading live data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium text-red-600 mb-2">Failed to load data</p>
        <p className="text-xs text-gray-500 mb-4 max-w-md">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!hasLiveData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Database className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700 mb-1">No synced data yet</p>
        <p className="text-xs text-gray-500 mb-4 max-w-md">
          Connect QuickBooks on Settings and run a sync to populate your dashboard with real data.
        </p>
        <Button asChild size="sm">
          <Link href="/settings">Go to Settings</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
