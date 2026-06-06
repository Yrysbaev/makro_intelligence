'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { RevenueByCategory } from '@/types';

const COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706', '#dc2626'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md">
        <p className="mb-1 text-xs font-semibold text-gray-700">{payload[0].name}</p>
        <p className="text-sm font-bold text-blue-600">{formatCurrency(payload[0].value)}</p>
        <p className="text-xs text-gray-500">{payload[0].payload.percentage}% of total</p>
      </div>
    );
  }
  return null;
};

interface CategoryPieChartProps {
  data: RevenueByCategory[];
  height?: number;
}

export default function CategoryPieChart({ data, height = 260 }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={3}
          dataKey="revenue"
          nameKey="category"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
