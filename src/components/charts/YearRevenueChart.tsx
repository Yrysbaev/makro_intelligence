'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { MonthlyComparisonPoint } from '@/types';

interface YearRevenueChartProps {
  data: MonthlyComparisonPoint[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600">{label}</p>
        {payload.map((e: any) =>
          e.value == null ? null : (
            <p key={e.dataKey} className="text-sm font-semibold" style={{ color: e.fill }}>
              {e.name}: {formatCurrency(e.value)}
            </p>
          )
        )}
      </div>
    );
  }
  return null;
};

export default function YearRevenueChart({ data, height = 300 }: YearRevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="revenue_2025" name="2025" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={22} />
        <Bar dataKey="revenue_2026" name="2026" fill="#1d4ed8" radius={[3, 3, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
