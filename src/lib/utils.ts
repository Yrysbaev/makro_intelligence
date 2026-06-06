import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  if (compact && value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getRetentionStatus(daysSinceLastOrder: number): 'active' | 'at_risk' | 'churned' | 'new' {
  if (daysSinceLastOrder <= 30) return 'active';
  if (daysSinceLastOrder <= 60) return 'at_risk';
  return 'churned';
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    return {
      ...groups,
      [groupKey]: [...(groups[groupKey] || []), item],
    };
  }, {} as Record<string, T[]>);
}

export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function getMonthName(monthNumber: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber - 1] || '';
}

export function generateMonthRange(months = 12): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

// Color palette for charts
export const CHART_COLORS = [
  '#1d4ed8', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0284c7', '#16a34a', '#ca8a04',
];

export const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-600 bg-green-50',
  at_risk: 'text-amber-600 bg-amber-50',
  churned: 'text-red-600 bg-red-50',
  new: 'text-blue-600 bg-blue-50',
  in_stock: 'text-green-600 bg-green-50',
  low_stock: 'text-amber-600 bg-amber-50',
  out_of_stock: 'text-red-600 bg-red-50',
  overstock: 'text-purple-600 bg-purple-50',
  paid: 'text-green-600 bg-green-50',
  pending: 'text-amber-600 bg-amber-50',
  overdue: 'text-red-600 bg-red-50',
  cancelled: 'text-gray-600 bg-gray-50',
  fast: 'text-green-600 bg-green-50',
  medium: 'text-blue-600 bg-blue-50',
  slow: 'text-amber-600 bg-amber-50',
};
