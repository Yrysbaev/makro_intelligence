'use client';

import { useCallback, useEffect, useState } from 'react';

export type AnalyticsView =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'sales-managers'
  | 'revenue'
  | 'inventory'
  | 'meta';

interface UseAnalyticsDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAnalyticsData<T = Record<string, unknown>>(
  view: AnalyticsView
): UseAnalyticsDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/data?view=${view}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load data');
      setData(json as T);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
