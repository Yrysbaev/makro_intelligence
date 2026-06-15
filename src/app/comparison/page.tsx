'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import YearRevenueChart from '@/components/charts/YearRevenueChart';
import ProductBarChart from '@/components/charts/ProductBarChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { YearComparison } from '@/types';

interface ComparisonData {
  hasLiveData: boolean;
  comparison: YearComparison;
}

const statusBadge = {
  matched: { variant: 'success' as const, label: 'Both years' },
  only_2026: { variant: 'info' as const, label: 'New in 2026' },
  only_2025: { variant: 'warning' as const, label: 'Dropped' },
};

function DeltaPill({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-xs text-gray-400">—</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-600'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

export default function ComparisonPage() {
  const { data, loading, error, refresh } = useAnalyticsData<ComparisonData>('comparison');
  const [statusFilter, setStatusFilter] = useState('all');

  const c = data?.comparison;
  const revDelta =
    c && c.summary.revenue_2025 > 0
      ? ((c.summary.revenue_2026 - c.summary.revenue_2025) / c.summary.revenue_2025) * 100
      : null;

  const products = (c?.products ?? []).filter((p) =>
    statusFilter === 'all' ? true : p.status === statusFilter
  );

  const topCategories = (c?.categories ?? [])
    .slice(0, 10)
    .map((cat) => ({ name: cat.category, revenue: cat.revenue_2025 + cat.revenue_2026 }));

  return (
    <div className="flex flex-col">
      <Header title="2025 vs 2026" subtitle="Year-over-year comparison · 2025 from records, 2026 from QuickBooks" />
      <DataState loading={loading} error={error} hasLiveData={data?.hasLiveData ?? false} onRetry={refresh}>
        {c && (
          <div className="p-6 space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{c.summary.label_2025}</p>
                <p className="mt-1 text-2xl font-bold text-gray-700">{formatCurrency(c.summary.revenue_2025)}</p>
                <p className="mt-1 text-xs text-gray-400">{formatNumber(c.summary.orders_2025)} invoices</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">{c.summary.label_2026}</p>
                <p className="mt-1 text-2xl font-bold text-blue-700">{formatCurrency(c.summary.revenue_2026)}</p>
                <div className="mt-1"><DeltaPill pct={revDelta} /></div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Products both years</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{formatNumber(c.summary.matched_products)}</p>
                <p className="mt-1 text-xs text-gray-400">{c.summary.new_products} new · {c.summary.dropped_products} dropped</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">Invoices 2026 YTD</p>
                <p className="mt-1 text-2xl font-bold text-violet-600">{formatNumber(c.summary.orders_2026)}</p>
                <p className="mt-1 text-xs text-gray-400">vs {formatNumber(c.summary.orders_2025)} in 2025</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Revenue — 2025 vs 2026</CardTitle>
                  <CardDescription>2026 bars stop at the latest synced month</CardDescription>
                </CardHeader>
                <CardContent>
                  <YearRevenueChart data={c.monthly} height={320} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top Categories</CardTitle>
                  <CardDescription>Combined 2025 + 2026 revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductBarChart data={topCategories} horizontal height={320} />
                </CardContent>
              </Card>
            </div>

            {/* Product comparison table */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Product Comparison</CardTitle>
                    <CardDescription>{products.length} products</CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="matched">Sold both years</SelectItem>
                      <SelectItem value="only_2026">New in 2026</SelectItem>
                      <SelectItem value="only_2025">Dropped since 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Product', 'SKU', '2025 Revenue', '2026 Revenue', 'Δ', '2025 Units', '2026 Units', 'Status'].map((h) => (
                          <th key={h} className="pb-3 px-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.slice(0, 300).map((p) => {
                        const sb = statusBadge[p.status];
                        return (
                          <tr key={p.key} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2 font-medium text-gray-800 max-w-[320px] truncate" title={p.product_name}>{p.product_name}</td>
                            <td className="py-3 px-2 font-mono text-xs text-gray-500">{p.sku || '—'}</td>
                            <td className="py-3 px-2 text-gray-700">{formatCurrency(p.revenue_2025)}</td>
                            <td className="py-3 px-2 font-semibold text-gray-900">{formatCurrency(p.revenue_2026)}</td>
                            <td className="py-3 px-2"><DeltaPill pct={p.revenue_delta_pct} /></td>
                            <td className="py-3 px-2 text-gray-600">{formatNumber(p.units_2025)}</td>
                            <td className="py-3 px-2 text-gray-600">{formatNumber(p.units_2026)}</td>
                            <td className="py-3 px-2"><Badge variant={sb.variant} className="text-[10px] px-1.5 py-0">{sb.label}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {products.length === 0 && (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
                      <Minus className="h-5 w-5" /> No products for this filter.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
