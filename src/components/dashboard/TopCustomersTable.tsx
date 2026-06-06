import { formatCurrency } from '@/lib/utils';
import type { TopCustomer } from '@/types';

interface TopCustomersTableProps {
  customers: TopCustomer[];
}

export default function TopCustomersTable({ customers }: TopCustomersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
            <th className="pb-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
            <th className="pb-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Orders</th>
            <th className="pb-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wide">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {customers.map((customer) => (
            <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                  {customer.rank}
                </span>
              </td>
              <td className="py-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{customer.customer_name}</span>
                  <span className="text-xs text-gray-400">
                    {customer.city}, {customer.state} · {customer.sales_manager}
                  </span>
                </div>
              </td>
              <td className="py-3 text-center text-gray-600">{customer.orders}</td>
              <td className="py-3 text-right font-semibold text-gray-900">
                {formatCurrency(customer.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
