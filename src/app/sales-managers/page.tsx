'use client';

import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import TerritoryBarChart from '@/components/charts/TerritoryBarChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency } from '@/lib/utils';
import type { CustomerAnalytics, SalesManagerAnalytics } from '@/types';

interface SalesManagersData {
  hasLiveData: boolean;
  salesManagerAnalytics: SalesManagerAnalytics[];
  revenueByTerritory: { territory: string; revenue: number; growth: number }[];
  customerAnalytics: CustomerAnalytics[];
}

export default function SalesManagersPage() {
  const { data, loading, error, refresh } = useAnalyticsData<SalesManagersData>('sales-managers');

  const managers = data?.salesManagerAnalytics ?? [];
  const customers = data?.customerAnalytics ?? [];
  const territory = data?.revenueByTerritory ?? [];
  const totalRevenue = managers.reduce((s, m) => s + m.total_revenue, 0) || 1;

  return (
    <div className="flex flex-col">
      <Header title="Sales Manager Analytics" subtitle="Territory performance and KPIs by manager" />
      <DataState loading={loading} error={error} hasLiveData={data?.hasLiveData ?? false} onRetry={refresh}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Total Managers', value: managers.length },
              { label: 'Total Revenue', value: formatCurrency(totalRevenue === 1 ? 0 : totalRevenue) },
              { label: 'Avg Revenue/Manager', value: managers.length ? formatCurrency(totalRevenue / managers.length) : '$0' },
              { label: 'Reorder Opportunities', value: managers.reduce((s, m) => s + m.reorder_opportunities, 0) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {managers.map((mgr) => {
              const revenueShare = (mgr.total_revenue / totalRevenue) * 100;
              const mgrCustomers = customers.filter((c) => c.sales_manager === mgr.manager_name);
              return (
                <Card key={mgr.manager_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                          {mgr.manager_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{mgr.manager_name}</p>
                          <p className="text-xs text-gray-500">{mgr.territory} Territory</p>
                        </div>
                      </div>
                      <Badge variant="info" className="text-xs">
                        {mgrCustomers.length} customers
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Revenue</span>
                          <span className="font-semibold text-gray-800">{formatCurrency(mgr.total_revenue)}</span>
                        </div>
                        <Progress value={revenueShare} className="h-2" />
                        <p className="text-[10px] text-gray-400 mt-0.5">{revenueShare.toFixed(1)}% of total</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-50">
                        <div className="text-center">
                          <p className="text-base font-bold text-gray-900">{mgr.customer_count}</p>
                          <p className="text-[10px] text-gray-400">Customers</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-gray-900">{mgr.active_customers}</p>
                          <p className="text-[10px] text-gray-400">Active</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-gray-900">{mgr.new_customers}</p>
                          <p className="text-[10px] text-gray-400">New</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Territory</CardTitle>
                <CardDescription>From synced invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <TerritoryBarChart data={territory} height={260} showGrowth={false} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Growth by Territory</CardTitle>
                <CardDescription>Month-over-month growth rate</CardDescription>
              </CardHeader>
              <CardContent>
                <TerritoryBarChart data={territory} height={260} showGrowth={true} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manager Performance Table</CardTitle>
              <CardDescription>Detailed KPIs per manager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Manager', 'Territory', 'Total Revenue', 'Customers', 'Active', 'New'].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {managers.map((mgr) => (
                      <tr key={mgr.manager_id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pl-0 pr-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {mgr.manager_name.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-800">{mgr.manager_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{mgr.territory}</td>
                        <td className="py-3 px-2 font-semibold text-gray-900">{formatCurrency(mgr.total_revenue)}</td>
                        <td className="py-3 px-2 text-gray-700">{mgr.customer_count}</td>
                        <td className="py-3 px-2 text-green-600 font-medium">{mgr.active_customers}</td>
                        <td className="py-3 px-2 text-blue-600">{mgr.new_customers}</td>
                      </tr>
                    ))}
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
