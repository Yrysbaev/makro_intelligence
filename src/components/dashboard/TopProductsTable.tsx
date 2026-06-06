import { formatCurrency, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TopProduct } from '@/types';

interface TopProductsTableProps {
  products: TopProduct[];
}

const categoryColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'purple'> = {
  'Meat & Poultry': 'danger',
  'Seafood': 'info',
  'Dairy': 'warning',
  'Dry Goods': 'purple',
  'Produce': 'success',
};

export default function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Units</th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.map((product) => (
            <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {product.rank}
                </span>
              </td>
              <td className="py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{product.product_name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{product.sku}</span>
                    <Badge variant={categoryColors[product.category] || 'secondary'} className="text-[10px] px-1.5 py-0">
                      {product.category}
                    </Badge>
                  </div>
                </div>
              </td>
              <td className="py-3 text-right text-gray-600">
                {formatNumber(product.units_sold)}
              </td>
              <td className="py-3 text-right font-semibold text-gray-900">
                {formatCurrency(product.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
