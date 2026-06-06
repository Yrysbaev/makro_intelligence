'use client';

import { useState } from 'react';
import { Search, AlertCircle, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { sampleInventory } from '@/lib/sample-data';
import { formatDate } from '@/lib/utils';

const statusConfig = {
  in_stock: { variant: 'success' as const, label: 'In Stock', icon: CheckCircle, iconColor: 'text-green-500' },
  low_stock: { variant: 'warning' as const, label: 'Low Stock', icon: AlertTriangle, iconColor: 'text-amber-500' },
  out_of_stock: { variant: 'danger' as const, label: 'Out of Stock', icon: AlertCircle, iconColor: 'text-red-500' },
  overstock: { variant: 'purple' as const, label: 'Overstock', icon: Package, iconColor: 'text-purple-500' },
};

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = sampleInventory.filter((item) => {
    const matchesSearch =
      (item.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.product_sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    in_stock: sampleInventory.filter((i) => i.status === 'in_stock').length,
    low_stock: sampleInventory.filter((i) => i.status === 'low_stock').length,
    out_of_stock: sampleInventory.filter((i) => i.status === 'out_of_stock').length,
    overstock: sampleInventory.filter((i) => i.status === 'overstock').length,
  };

  return (
    <div className="flex flex-col">
      <Header title="Inventory Management" subtitle="Stock levels, reorder points, and alerts" />
      <div className="p-6 space-y-6">

        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Object.entries(statusConfig).map(([key, conf]) => {
            const Icon = conf.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                className={`rounded-xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${statusFilter === key ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${conf.iconColor}`} />
                  <span className="text-2xl font-bold text-gray-900">{counts[key as keyof typeof counts]}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{conf.label}</p>
              </button>
            );
          })}
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Inventory Items</CardTitle>
                <CardDescription>{filtered.length} items shown</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 w-52 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-40 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
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
                    {['Product', 'SKU', 'On Hand', 'Reorder Point', 'Stock Level', 'Location', 'Status', 'Last Updated'].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item) => {
                    const conf = statusConfig[item.status as keyof typeof statusConfig];
                    const Icon = conf.icon;
                    const stockPct = item.reorder_point > 0
                      ? Math.min(100, (item.quantity_on_hand / (item.reorder_point * 2)) * 100)
                      : 50;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pl-0 pr-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 shrink-0 ${conf.iconColor}`} />
                            <span className="font-semibold text-gray-800">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-500 font-mono text-xs">{item.product_sku}</td>
                        <td className="py-3 px-2">
                          <span className={`font-semibold ${item.quantity_on_hand === 0 ? 'text-red-600' : item.quantity_on_hand <= item.reorder_point ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.quantity_on_hand}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-gray-600">{item.reorder_point}</td>
                        <td className="py-3 px-2 w-28">
                          <Progress
                            value={stockPct}
                            className={`h-1.5 ${item.status === 'out_of_stock' ? '[&>div]:bg-red-500' : item.status === 'low_stock' ? '[&>div]:bg-amber-500' : item.status === 'overstock' ? '[&>div]:bg-purple-500' : '[&>div]:bg-green-500'}`}
                          />
                        </td>
                        <td className="py-3 px-2 text-gray-500 text-xs font-mono">{item.warehouse_location || '—'}</td>
                        <td className="py-3 px-2">
                          <Badge variant={conf.variant} className="text-[10px] px-1.5 py-0">{conf.label}</Badge>
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-500">{formatDate(item.last_updated)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-gray-400">No items match your search criteria.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reorder Recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reorder Recommendations</CardTitle>
            <CardDescription>Items that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sampleInventory
                .filter((i) => i.status === 'out_of_stock' || i.status === 'low_stock')
                .map((item) => {
                  const conf = statusConfig[item.status as keyof typeof statusConfig];
                  const Icon = conf.icon;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-4 ${item.status === 'out_of_stock' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 shrink-0 ${conf.iconColor}`} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                            <p className="text-xs text-gray-500">{item.product_sku} · {item.warehouse_location}</p>
                          </div>
                        </div>
                        <Badge variant={conf.variant} className="text-[10px]">{conf.label}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{item.quantity_on_hand}</p>
                          <p className="text-gray-500">On Hand</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.reorder_point}</p>
                          <p className="text-gray-500">Reorder At</p>
                        </div>
                        <div>
                          <p className="font-bold text-blue-600">{item.reorder_quantity}</p>
                          <p className="text-gray-500">Order Qty</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
