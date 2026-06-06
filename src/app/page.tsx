'use client';

import { DollarSign, Users, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import TopProductsTable from '@/components/dashboard/TopProductsTable';
import TopCustomersTable from '@/components/dashboard/TopCustomersTable';
import ReorderAlerts from '@/components/dashboard/ReorderAlerts';
import RevenueLineChart from '@/components/charts/RevenueLineChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import TerritoryBarChart from '@/components/charts/TerritoryBarChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { DashboardMetrics, InventoryItem, RevenueByCategory, RevenueByPeriod, SalesManagerAnalytics, TopCustomer, TopProduct } from '@/types';

interface DashboardData {
  hasLiveData: boolean;
  metrics: DashboardMetrics;
  monthlyRevenue: RevenueByPeriod[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  revenueByCategory: RevenueByCategory[];
  revenueByTerritory: { territory: string; revenue: number; growth: number }[];
  salesManagerAnalytics: SalesManagerAnalytics[];
  inventory: InventoryItem[];
}

export default function DashboardPage() {
  const { data, loading, error, refresh } = useAnalyticsData<DashboardData>('dashboard');

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        subtitle={`Overview · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <DataState
        loading={loading}
        error={error}
        hasLiveData={data?.hasLiveData ?? false}
        onRetry={refresh}
      >
        {data && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard
                title="Monthly Revenue"
                value={data.metrics.total_revenue}
                format="currency"
                change={data.metrics.revenue_growth}
                icon={DollarSign}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
                subtitle="vs. last month"
              />
              <MetricCard
                title="Total Customers"
                value={data.metrics.total_customers}
                change={data.metrics.customer_growth}
                icon={Users}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
                subtitle="active accounts"
              />
              <MetricCard
                title="Total Products"
                value={data.metrics.total_products}
                icon={Package}
                iconColor="text-violet-600"
                iconBg="bg-violet-50"
                subtitle="active SKUs"
              />
              <MetricCard
                title="Monthly Orders"
                value={data.metrics.total_orders}
                icon={ShoppingCart}
                iconColor="text-amber-600"
                iconBg="bg-amber-50"
                subtitle={`Avg ${formatCurrency(data.metrics.avg_order_value)}/order`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
                      <CardDescription>From synced QuickBooks invoices</CardDescription>
                    </div>
                    {data.metrics.revenue_growth !== 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        {data.metrics.revenue_growth >= 0 ? '+' : ''}
                        {data.metrics.revenue_growth.toFixed(1)}% vs last month
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <RevenueLineChart data={data.monthlyRevenue} height={260} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue by Category</CardTitle>
                  <CardDescription>From invoice line items</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryPieChart data={data.revenueByCategory} height={260} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Best-Selling Products</CardTitle>
                      <CardDescription>By revenue this month</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 8</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <TopProductsTable products={data.topProducts} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Top Customers</CardTitle>
                      <CardDescription>By revenue this month</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 5</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <TopCustomersTable customers={data.topCustomers} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Revenue by Territory</CardTitle>
                  <CardDescription>Sales manager performance by region</CardDescription>
                </CardHeader>
                <CardContent>
                  <TerritoryBarChart data={data.revenueByTerritory} height={220} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Reorder Alerts</CardTitle>
                      <CardDescription>Inventory requiring attention</CardDescription>
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                      {data.inventory.filter((i) => i.status === 'out_of_stock' || i.status === 'low_stock').length}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ReorderAlerts items={data.inventory} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sales Manager Performance</CardTitle>
                <CardDescription>Summary from synced data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Manager</th>
                        <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Territory</th>
                        <th className="pb-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Customers</th>
                        <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.salesManagerAnalytics.map((mgr) => (
                        <tr key={mgr.manager_id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                {mgr.manager_name.charAt(0)}
                              </div>
                              <span className="font-semibold text-gray-800">{mgr.manager_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{mgr.territory}</td>
                          <td className="py-3 text-center text-gray-700">
                            {mgr.active_customers}/{mgr.customer_count}
                          </td>
                          <td className="py-3 text-right font-semibold text-gray-900">
                            {formatCurrency(mgr.total_revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
