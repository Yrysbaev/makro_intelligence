import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, invalidateAnalyticsCache } from '@/lib/analytics';
import { formatFetchError } from '@/lib/retry';

export async function GET(request: NextRequest) {
  try {
    const view = request.nextUrl.searchParams.get('view') || 'dashboard';
    const data = await getAnalytics();

    switch (view) {
      case 'meta':
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          counts: data.counts,
        });
      case 'customers':
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          customerAnalytics: data.customerAnalytics,
        });
      case 'products':
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          productAnalytics: data.productAnalytics,
          revenueByCategory: data.revenueByCategory,
        });
      case 'revenue':
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          monthlyRevenue: data.monthlyRevenue,
          weeklyRevenue: data.weeklyRevenue,
          revenueByTerritory: data.revenueByTerritory,
          topProducts: data.topProducts,
          revenueByCategory: data.revenueByCategory,
          topCustomers: data.topCustomers,
        });
      case 'inventory':
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          inventory: data.inventory,
        });
      case 'dashboard':
      default:
        return NextResponse.json({
          hasLiveData: data.hasLiveData,
          metrics: data.metrics,
          lastMonthDaily: data.lastMonthDaily,
          monthComparison: data.monthComparison,
          monthSummary: data.monthSummary,
          topProducts: data.topProducts,
          topCustomers: data.topCustomers,
          topMarginProducts: data.topMarginProducts,
        });
    }
  } catch (err: unknown) {
    console.error('Analytics API error:', err);
    const message = formatFetchError(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  invalidateAnalyticsCache();
  return NextResponse.json({ success: true });
}
