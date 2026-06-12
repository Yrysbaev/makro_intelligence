'use client';

import { DollarSign, CalendarDays, History, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import DailyRevenueChart from '@/components/charts/DailyRevenueChart';
import MonthComparisonChart from '@/components/charts/MonthComparisonChart';
import ProductBarChart from '@/components/charts/ProductBarChart';
import MarginBarChart from '@/components/charts/MarginBarChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type {
  DailyRevenuePoint,
  DashboardMetrics,
  MonthComparisonPoint,
  MonthSummary,
  TopCustomer,
  TopMarginProduct,
  TopProduct,
} from '@/types';

interface DashboardData {
  hasLiveData: boolean;
  metrics: DashboardMetrics;
  lastMonthDaily: DailyRevenuePoint[];
  monthComparison: MonthComparisonPoint[];
  monthSummary: MonthSummary;
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  topMarginProducts: TopMarginProduct[];
}

export default function DashboardPage() {
  const { data, loading, error, refresh } = useAnalyticsData<DashboardData>('dashboard');
  const summary = data?.monthSummary;

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
        {data && summary && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <MetricCard
                title={`This Month (${summary.thisMonthLabel})`}
                value={summary.thisMonthRevenue}
                format="currency"
                change={summary.yoyMtdGrowth}
                icon={DollarSign}
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
                subtitle={`vs ${summary.lastYearLabel} same days`}
              />
              <MetricCard
                title={`Last Month (${summary.lastMonthLabel})`}
                value={summary.lastMonthRevenue}
                format="currency"
                icon={CalendarDays}
                iconColor="text-violet-600"
                iconBg="bg-violet-50"
                subtitle="total revenue"
              />
              <MetricCard
                title={`Last Year (${summary.lastYearLabel})`}
                value={summary.lastYearTotalRevenue}
                format="currency"
                icon={History}
                iconColor="text-emerald-600"
                iconBg="bg-emerald-50"
                subtitle="full month total"
              />
              <MetricCard
                title="Orders This Month"
                value={summary.thisMonthOrders}
                icon={ShoppingCart}
                iconColor="text-amber-600"
                iconBg="bg-amber-50"
                subtitle={`Avg ${formatCurrency(
                  summary.thisMonthOrders ? summary.thisMonthRevenue / summary.thisMonthOrders : 0
                )}/order`}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Last Month Revenue by Day</CardTitle>
                  <CardDescription>{summary.lastMonthLabel} · daily invoice totals</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyRevenueChart data={data.lastMonthDaily} height={280} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">This Month vs Last Year</CardTitle>
                      <CardDescription>
                        Cumulative revenue · {summary.thisMonthLabel} vs {summary.lastYearLabel}
                      </CardDescription>
                    </div>
                    {summary.yoyMtdGrowth !== 0 && (
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          summary.yoyMtdGrowth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {summary.yoyMtdGrowth >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {summary.yoyMtdGrowth >= 0 ? '+' : ''}
                        {summary.yoyMtdGrowth.toFixed(1)}% vs last year
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <MonthComparisonChart
                    data={data.monthComparison}
                    thisMonthLabel={summary.thisMonthLabel}
                    lastYearLabel={summary.lastYearLabel}
                    height={280}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Top Customers</CardTitle>
                      <CardDescription>By revenue · {summary.thisMonthLabel}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 10</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProductBarChart
                    data={data.topCustomers.map((c) => ({ name: c.customer_name, revenue: c.revenue }))}
                    height={340}
                    horizontal
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Best-Selling Products</CardTitle>
                      <CardDescription>By revenue · {summary.thisMonthLabel}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 10</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ProductBarChart
                    data={data.topProducts.map((p) => ({ name: p.product_name, revenue: p.revenue }))}
                    height={340}
                    horizontal
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Highest Margin Products</CardTitle>
                      <CardDescription>By profit margin · {summary.thisMonthLabel}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">Top 10</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <MarginBarChart data={data.topMarginProducts} height={340} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
