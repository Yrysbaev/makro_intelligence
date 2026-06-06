import { AlertTriangle, AlertCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/types';

interface ReorderAlertsProps {
  items: InventoryItem[];
}

const statusConfig = {
  out_of_stock: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    badgeVariant: 'danger' as const,
    label: 'Out of Stock',
  },
  low_stock: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    badgeVariant: 'warning' as const,
    label: 'Low Stock',
  },
};

export default function ReorderAlerts({ items }: ReorderAlertsProps) {
  const alertItems = items.filter((i) => i.status === 'out_of_stock' || i.status === 'low_stock');

  if (alertItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-10 w-10 text-green-400 mb-2" />
        <p className="text-sm font-medium text-gray-600">All items in stock</p>
        <p className="text-xs text-gray-400">No reorder alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alertItems.map((item) => {
        const config = statusConfig[item.status as keyof typeof statusConfig];
        const Icon = config?.icon || AlertTriangle;
        return (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-4 w-4 shrink-0 ${config?.iconColor}`} />
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity_on_hand} on hand · Reorder at {item.reorder_point}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config?.badgeVariant || 'warning'} className="text-[10px]">
                {config?.label}
              </Badge>
            </div>
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="w-full text-xs mt-2">
        View All Inventory
      </Button>
    </div>
  );
}
