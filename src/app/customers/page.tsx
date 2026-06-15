'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CustomerAnalytics } from '@/types';

interface CustomersData {
  hasLiveData: boolean;
  customerAnalytics: CustomerAnalytics[];
}

const retentionConfig = {
  active: { variant: 'success' as const, label: 'Active' },
  at_risk: { variant: 'warning' as const, label: 'At Risk' },
  churned: { variant: 'danger' as const, label: 'Churned' },
  new: { variant: 'info' as const, label: 'New' },
};

const trendConfig = {
  growing: { icon: <TrendingUp className="h-3.5 w-3.5 text-green-500" />, label: 'Growing' },
  declining: { icon: <TrendingDown className="h-3.5 w-3.5 text-red-500" />, label: 'Declining' },
  stable: { icon: <Minus className="h-3.5 w-3.5 text-gray-400" />, label: 'Stable' },
};

export default function CustomersPage() {
  const { data, loading, error, refresh } = useAnalyticsData<CustomersData>('customers');
  const [search, setSearch] = useState('');
  const [retentionFilter, setRetentionFilter] = useState('all');

  const customers = data?.customerAnalytics ?? [];

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchesRetention = retentionFilter === 'all' || c.retention_status === retentionFilter;
    return matchesSearch && matchesRetention;
  });

  const activeCount = customers.filter((c) => c.retention_status === 'active').length;
  const atRiskCount = customers.filter((c) => c.retention_status === 'at_risk').length;
  const churnedCount = customers.filter((c) => c.retention_status === 'churned').length;

  return (
    <div className="flex flex-col">
      <Header title="Customer Analytics" subtitle="Customer performance, retention, and growth" />
      <DataState loading={loading} error={error} hasLiveData={data?.hasLiveData ?? false} onRetry={refresh}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Total Customers', value: customers.length, color: 'text-blue-600' },
              { label: 'Active', value: activeCount, color: 'text-green-600' },
              { label: 'At Risk', value: atRiskCount, color: 'text-amber-600' },
              { label: 'Churned', value: churnedCount, color: 'text-red-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Customer Details</CardTitle>
                  <CardDescription>{filtered.length} customers found</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 w-52 text-sm"
                    />
                  </div>
                  <Select value={retentionFilter} onValueChange={setRetentionFilter}>
                    <SelectTrigger className="h-9 w-36 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Customer', 'Location', 'Orders', 'Avg Order', 'Revenue', 'Last Order', 'Status', 'Trend'].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((customer) => {
                      const ret = retentionConfig[customer.retention_status];
                      const trend = trendConfig[customer.trend];
                      return (
                        <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pl-0 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 shrink-0">
                                {customer.customer_name.charAt(0)}
                              </div>
                              <span className="font-semibold text-gray-800">{customer.customer_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-600 text-xs">{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}</td>
                          <td className="py-3 px-2 text-gray-700">{customer.order_count}</td>
                          <td className="py-3 px-2 text-gray-600">{formatCurrency(customer.avg_order_value)}</td>
                          <td className="py-3 px-2 font-semibold text-gray-900">{formatCurrency(customer.total_revenue)}</td>
                          <td className="py-3 px-2 text-xs text-gray-500">{customer.last_order_date ? formatDate(customer.last_order_date) : '—'}</td>
                          <td className="py-3 px-2">
                            <Badge variant={ret.variant} className="text-[10px] px-1.5 py-0">{ret.label}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              {trend.icon}
                              <span className="text-xs text-gray-500">{trend.label}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-gray-400">No customers match your search criteria.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DataState>
    </div>
  );
}
