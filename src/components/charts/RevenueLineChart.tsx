'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { formatCurrency, getMonthName } from '@/lib/utils';
import type { RevenueByPeriod } from '@/types';

interface RevenueLineChartProps {
  data: RevenueByPeriod[];
  height?: number;
}

function formatPeriodLabel(period: string): string {
  if (period.includes('-')) {
    const [year, month] = period.split('-');
    return getMonthName(parseInt(month));
  }
  return period;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600">{label}</p>
        <p className="text-sm font-bold text-blue-600">
          {formatCurrency(payload[0]?.value || 0)}
        </p>
        {payload[1] && (
          <p className="text-xs text-gray-500">{payload[1]?.value} orders</p>
        )}
      </div>
    );
  }
  return null;
};

export default function RevenueLineChart({ data, height = 280 }: RevenueLineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatPeriodLabel(d.period),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1d4ed8"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
