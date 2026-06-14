'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductBarChart from '@/components/charts/ProductBarChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import { DataState } from '@/components/shared/DataState';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import type { ProductAnalytics, ProductSale, RevenueByCategory } from '@/types';

interface ProductsData {
  hasLiveData: boolean;
  productAnalytics: ProductAnalytics[];
  revenueByCategory: RevenueByCategory[];
}

const velocityConfig = {
  fast: { variant: 'success' as const, label: 'Fast Moving' },
  medium: { variant: 'info' as const, label: 'Medium' },
  slow: { variant: 'warning' as const, label: 'Slow Moving' },
};

const trendIcons = {
  up: <TrendingUp className="h-3.5 w-3.5 text-green-500" />,
  down: <TrendingDown className="h-3.5 w-3.5 text-red-500" />,
  stable: <Minus className="h-3.5 w-3.5 text-gray-400" />,
};

export default function ProductsPage() {
  const { data, loading, error, refresh } = useAnalyticsData<ProductsData>('products');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [velocityFilter, setVelocityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [salesByProduct, setSalesByProduct] = useState<Record<string, ProductSale[]>>({});
  const [loadingSales, setLoadingSales] = useState<string | null>(null);

  async function toggleProduct(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);
    if (!salesByProduct[productId]) {
      setLoadingSales(productId);
      try {
        const res = await fetch(`/api/data?view=product-sales&productId=${productId}`);
        const json = await res.json();
        setSalesByProduct((prev) => ({ ...prev, [productId]: json.sales ?? [] }));
      } catch {
        setSalesByProduct((prev) => ({ ...prev, [productId]: [] }));
      } finally {
        setLoadingSales(null);
      }
    }
  }

  const products = data?.productAnalytics ?? [];
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesVelocity = velocityFilter === 'all' || p.velocity === velocityFilter;
    return matchesSearch && matchesCategory && matchesVelocity;
  });

  const topByRevenue = [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p) => ({ name: p.product_name.split(' ').slice(0, 2).join(' '), revenue: p.revenue }));

  return (
    <div className="flex flex-col">
      <Header title="Product Analytics" subtitle="Performance and inventory insights by SKU" />
      <DataState loading={loading} error={error} hasLiveData={data?.hasLiveData ?? false} onRetry={refresh}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: 'Total Products', value: products.length.toString(), color: 'text-blue-600' },
              { label: 'Fast Moving', value: products.filter((p) => p.velocity === 'fast').length.toString(), color: 'text-green-600' },
              { label: 'Slow Moving', value: products.filter((p) => p.velocity === 'slow').length.toString(), color: 'text-amber-600' },
              { label: 'Total Revenue', value: formatCurrency(products.reduce((s, p) => s + p.revenue, 0)), color: 'text-violet-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Products by Revenue</CardTitle>
                <CardDescription>From synced invoice line items</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductBarChart data={topByRevenue} horizontal height={300} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue by Category</CardTitle>
                <CardDescription>Category distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={data?.revenueByCategory ?? []} height={300} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Product Details</CardTitle>
                  <CardDescription>{filtered.length} products found</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 w-56 text-sm"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 w-40 text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={velocityFilter} onValueChange={setVelocityFilter}>
                    <SelectTrigger className="h-9 w-40 text-sm">
                      <SelectValue placeholder="Velocity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Velocity</SelectItem>
                      <SelectItem value="fast">Fast Moving</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="slow">Slow Moving</SelectItem>
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
                      <th className="pb-3 w-8" />
                      {['Product', 'SKU', 'Category', 'Cases Sold', 'Revenue', 'Avg Price', 'Margin', 'Velocity', 'Trend'].map((h) => (
                        <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((product) => {
                      const vel = velocityConfig[product.velocity];
                      const isExpanded = expandedId === product.product_id;
                      const sales = salesByProduct[product.product_id];
                      return (
                        <React.Fragment key={product.product_id}>
                          <tr
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleProduct(product.product_id)}
                          >
                            <td className="py-3 pl-1 pr-1 text-gray-400">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </td>
                            <td className="py-3 px-2 font-semibold text-gray-800">{product.product_name}</td>
                            <td className="py-3 px-2 text-gray-500 font-mono text-xs">{product.sku}</td>
                            <td className="py-3 px-2 text-gray-600">{product.category}</td>
                            <td className="py-3 px-2 text-gray-700">{formatNumber(product.cases_sold)}</td>
                            <td className="py-3 px-2 font-semibold text-gray-900">{formatCurrency(product.revenue)}</td>
                            <td className="py-3 px-2 text-gray-600">{formatCurrency(product.avg_price)}</td>
                            <td className="py-3 px-2">
                              <span className={`text-xs font-semibold ${product.profit_margin > 40 ? 'text-green-600' : product.profit_margin > 30 ? 'text-blue-600' : 'text-amber-600'}`}>
                                {product.profit_margin.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={vel.variant} className="text-[10px] px-1.5 py-0">{vel.label}</Badge>
                            </td>
                            <td className="py-3 px-2">{trendIcons[product.trend]}</td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-gray-50/60">
                              <td colSpan={10} className="px-4 py-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Sales history — who bought it & when
                                </p>
                                {loadingSales === product.product_id ? (
                                  <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading sales…
                                  </div>
                                ) : sales && sales.length > 0 ? (
                                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                          {['Date', 'Invoice', 'Customer', 'Qty', 'Unit Price', 'Total'].map((h) => (
                                            <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {sales.map((s, i) => (
                                          <tr key={`${s.invoice_id}-${i}`} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{formatDate(s.invoice_date)}</td>
                                            <td className="px-3 py-2 font-mono text-xs text-gray-500">{s.invoice_number}</td>
                                            <td className="px-3 py-2 text-gray-800">{s.customer_name}</td>
                                            <td className="px-3 py-2 text-gray-700">{formatNumber(s.quantity)}</td>
                                            <td className="px-3 py-2 text-gray-600">{formatCurrency(s.unit_price)}</td>
                                            <td className="px-3 py-2 font-semibold text-gray-900">{formatCurrency(s.total)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="py-4 text-sm text-gray-400">No sales recorded for this product in the synced period.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-gray-400">No products match your search criteria.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DataState>
    </div>
  );
}
