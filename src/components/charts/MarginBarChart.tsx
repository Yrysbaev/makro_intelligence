'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { TopMarginProduct } from '@/types';

interface MarginBarChartProps {
  data: TopMarginProduct[];
  height?: number;
}

const COLORS = ['#059669', '#10b981', '#34d399', '#0891b2', '#06b6d4', '#1d4ed8', '#3b82f6', '#7c3aed', '#8b5cf6', '#d97706'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const p: TopMarginProduct = payload[0].payload;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600 truncate max-w-[220px]">{p.product_name}</p>
        <p className="text-sm font-bold text-emerald-600">{p.margin.toFixed(1)}% margin</p>
        <p className="text-xs text-gray-500">
          {formatCurrency(p.profit)} profit on {formatCurrency(p.revenue)}
        </p>
      </div>
    );
  }
  return null;
};

export default function MarginBarChart({ data, height = 320 }: MarginBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="product_name"
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey="margin" radius={[0, 4, 4, 0]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
