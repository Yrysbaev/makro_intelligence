'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface TerritoryData {
  territory: string;
  revenue: number;
  growth: number;
}

interface TerritoryBarChartProps {
  data: TerritoryData[];
  height?: number;
  showGrowth?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-600">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name === 'revenue' ? formatCurrency(p.value) : `${p.value > 0 ? '+' : ''}${p.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TerritoryBarChart({ data, height = 240, showGrowth = false }: TerritoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="territory"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={showGrowth ? (v) => `${v}%` : (v) => `$${(v / 1000).toFixed(0)}K`}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        {showGrowth && <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />}
        <Bar
          dataKey={showGrowth ? 'growth' : 'revenue'}
          name={showGrowth ? 'growth' : 'revenue'}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={showGrowth
                ? entry.growth >= 0 ? '#059669' : '#dc2626'
                : '#1d4ed8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
