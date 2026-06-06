'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import TerritoryBarChart from '@/components/charts/TerritoryBarChart';
import ProductBarChart from '@/components/charts/ProductBarChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency } from '@/lib/utils';
import type { RevenueByCategory, RevenueByPeriod, TopCustomer, TopProduct } from '@/types';

interface RevenueData {
  hasLiveData: boolean;
  monthlyRevenue: RevenueByPeriod[];
  weeklyRevenue: RevenueByPeriod[];
  revenueByTerritory: { territory: string; revenue: number; growth: number }[];
  topProducts: TopProduct[];
  revenueByCategory: RevenueByCategory[];
  topCustomers: TopCustomer[];
}

export default function RevenuePage() {
  const { data, loading, error, refresh } = useAnalyticsData<RevenueData>('revenue');

  const monthly = data?.monthlyRevenue ?? [];
  const currentMonth = monthly[monthly.length - 1];
  const prevMonth = monthly[monthly.length - 2];
  const growth = prevMonth && prevMonth.revenue > 0
    ? ((currentMonth?.revenue || 0) - prevMonth.revenue) / prevMonth.revenue * 100
    : 0;
  const totalYtd = monthly.reduce((s, r) => s + r.revenue, 0);

  const revenueByCustomer = (data?.topCustomers ?? []).map((c) => ({
    name: c.customer_name.split(' ').slice(0, 2).join(' '),
    revenue: c.revenue,
  }));

  const topProducts = data?.topProducts ?? [];

  return (
    <div className="flex flex-col">
      <Header title="Revenue Analytics" subtitle="Trends, breakdowns, and period comparisons" />
      <DataState loading={loading} error={error} hasLiveData={data?.hasLiveData ?? false} onRetry={refresh}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'This Month', value: formatCurrency(currentMonth?.revenue || 0), sub: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs last month`, subColor: growth >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: 'Last Month', value: formatCurrency(prevMonth?.revenue || 0), sub: `${prevMonth?.orders || 0} orders`, subColor: 'text-gray-500' },
              { label: 'YTD Revenue', value: formatCurrency(totalYtd), sub: `${monthly.length}-month total`, subColor: 'text-gray-500' },
              { label: 'Avg Monthly', value: formatCurrency(monthly.length ? totalYtd / monthly.length : 0), sub: 'rolling average', subColor: 'text-gray-500' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                <p className={`mt-1 text-xs font-medium ${stat.subColor}`}>{stat.sub}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="monthly">
                <TabsList className="mb-4">
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                <TabsContent value="weekly">
                  <RevenueLineChart data={data?.weeklyRevenue ?? []} height={280} />
                </TabsContent>
                <TabsContent value="monthly">
                  <RevenueLineChart data={monthly} height={280} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Territory</CardTitle>
                <CardDescription>By sales region</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="amount">
                  <TabsList className="mb-4">
                    <TabsTrigger value="amount">Revenue ($)</TabsTrigger>
                    <TabsTrigger value="growth">Growth (%)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="amount">
                    <TerritoryBarChart data={data?.revenueByTerritory ?? []} height={240} showGrowth={false} />
                  </TabsContent>
                  <TabsContent value="growth">
                    <TerritoryBarChart data={data?.revenueByTerritory ?? []} height={240} showGrowth={true} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Category</CardTitle>
                <CardDescription>Product category distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={data?.revenueByCategory ?? []} height={280} />
                <div className="mt-4 space-y-2">
                  {(data?.revenueByCategory ?? []).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${cat.percentage}%` }} />
                        </div>
                        <span className="w-12 text-right font-semibold text-gray-700">{formatCurrency(cat.revenue, true)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Customer</CardTitle>
                <CardDescription>Top customers</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductBarChart data={revenueByCustomer} horizontal height={260} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Product</CardTitle>
                <CardDescription>Top products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {topProducts.map((p, i) => {
                    const maxRevenue = topProducts[0]?.revenue || 1;
                    const pct = (p.revenue / maxRevenue) * 100;
                    return (
                      <div key={p.product_id} className="flex items-center gap-3">
                        <span className="w-5 text-xs font-bold text-gray-400">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{p.product_name}</span>
                            <span className="text-xs font-semibold text-gray-900 ml-2">{formatCurrency(p.revenue)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Revenue Comparison</CardTitle>
              <CardDescription>Detailed breakdown from synced invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Month', 'Revenue', 'Orders', 'Avg Order Value', 'vs Prior Month'].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...monthly].reverse().map((row, i, arr) => {
                      const prev = arr[i + 1];
                      const change = prev ? ((row.revenue - prev.revenue) / prev.revenue) * 100 : null;
                      return (
                        <tr key={row.period} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pl-0 pr-2 font-semibold text-gray-700">{row.period}</td>
                          <td className="py-3 px-2 font-bold text-gray-900">{formatCurrency(row.revenue)}</td>
                          <td className="py-3 px-2 text-gray-600">{row.orders}</td>
                          <td className="py-3 px-2 text-gray-600">{formatCurrency(row.avg_order_value)}</td>
                          <td className="py-3 px-2">
                            {change !== null ? (
                              <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DataState>
    </div>
  );
}
