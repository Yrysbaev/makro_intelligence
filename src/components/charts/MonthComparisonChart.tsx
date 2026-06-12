'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { MonthComparisonPoint } from '@/types';

interface MonthComparisonChartProps {
  data: MonthComparisonPoint[];
  thisMonthLabel: string;
  lastYearLabel: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600">Day {label}</p>
        {payload.map((entry: any) =>
          entry.value == null ? null : (
            <p key={entry.dataKey} className="text-sm font-semibold" style={{ color: entry.stroke }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          )
        )}
      </div>
    );
  }
  return null;
};

export default function MonthComparisonChart({
  data,
  thisMonthLabel,
  lastYearLabel,
  height = 260,
}: MonthComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="thisMonthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="plainline"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="lastYear"
          name={lastYearLabel}
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="thisMonth"
          name={thisMonthLabel}
          stroke="#1d4ed8"
          strokeWidth={2.5}
          fill="url(#thisMonthGradient)"
          dot={false}
          connectNulls={false}
          activeDot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#fff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
