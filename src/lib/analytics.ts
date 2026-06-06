import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { withRetry } from '@/lib/retry';
import type {
  CustomerAnalytics,
  DashboardMetrics,
  InventoryItem,
  ProductAnalytics,
  RevenueByCategory,
  RevenueByPeriod,
  SalesManagerAnalytics,
  TopCustomer,
  TopProduct,
} from '@/types';

interface DbCustomer {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  sales_manager_id: string | null;
  is_active: boolean;
  last_order_date: string | null;
  first_order_date: string | null;
  sales_managers?: { name: string; territory: string } | null;
}

interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit_price: number;
  cost_price: number;
  is_active: boolean;
}

interface DbInvoice {
  id: string;
  customer_id: string;
  sales_manager_id: string | null;
  invoice_date: string;
  total: number;
}

interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DbSalesManager {
  id: string;
  name: string;
  territory: string;
  is_active: boolean;
}

interface DbInventory {
  id: string;
  product_id: string;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
  warehouse_location: string | null;
  last_updated: string;
}

export interface AnalyticsBundle {
  hasLiveData: boolean;
  counts: {
    customers: number;
    products: number;
    invoices: number;
    salesManagers: number;
  };
  metrics: DashboardMetrics;
  monthlyRevenue: RevenueByPeriod[];
  weeklyRevenue: RevenueByPeriod[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  revenueByCategory: RevenueByCategory[];
  revenueByTerritory: { territory: string; revenue: number; growth: number }[];
  customerAnalytics: CustomerAnalytics[];
  productAnalytics: ProductAnalytics[];
  salesManagerAnalytics: SalesManagerAnalytics[];
  inventory: InventoryItem[];
}

function n(v: unknown): number {
  return Number(v) || 0;
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function inventoryStatus(qty: number, reorderPoint: number): InventoryItem['status'] {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= reorderPoint) return 'low_stock';
  if (reorderPoint > 0 && qty > reorderPoint * 3) return 'overstock';
  return 'in_stock';
}

async function fetchTable<T>(
  label: string,
  query: () => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  return withRetry(
    async () => {
      const { data, error } = await query();
      if (error) throw error;
      return (data || []) as T[];
    },
    { label, attempts: 3, delayMs: 2000 }
  );
}

async function fetchBaseData() {
  const db = getSupabaseAdmin();

  // Two batches of 3 — avoids saturating a slow/unstable connection with 6 parallel requests
  const [customers, products, salesManagers] = await Promise.all([
    fetchTable<DbCustomer>('customers', () =>
      db.from('customers').select('*, sales_managers(name, territory)')
    ),
    fetchTable<DbProduct>('products', () =>
      db.from('products').select('*').eq('is_active', true)
    ),
    fetchTable<DbSalesManager>('sales_managers', () =>
      db.from('sales_managers').select('*').eq('is_active', true)
    ),
  ]);

  const [invoices, invoiceItems, inventory] = await Promise.all([
    fetchTable<DbInvoice>('invoices', () => db.from('invoices').select('*')),
    fetchTable<DbInvoiceItem>('invoice_items', () => db.from('invoice_items').select('*')),
    fetchTable<DbInventory>('inventory', () => db.from('inventory').select('*')),
  ]);

  return {
    customers,
    products,
    salesManagers,
    invoices,
    invoiceItems,
    inventory,
  };
}

function buildAnalytics(data: Awaited<ReturnType<typeof fetchBaseData>>): AnalyticsBundle {
  const { customers, products, salesManagers, invoices, invoiceItems, inventory } = data;
  const now = new Date();
  const productMap = new Map(products.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const managerMap = new Map(salesManagers.map((m) => [m.id, m]));
  const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

  const hasLiveData =
    customers.length > 0 || products.length > 0 || invoices.length > 0;

  // ── Monthly / weekly revenue ───────────────────────────────────────────────
  const monthlyMap = new Map<string, { revenue: number; orders: Set<string> }>();
  const weeklyMap = new Map<string, { revenue: number; orders: Set<string> }>();

  for (const inv of invoices) {
    const mKey = monthKey(inv.invoice_date);
    if (!monthlyMap.has(mKey)) monthlyMap.set(mKey, { revenue: 0, orders: new Set() });
    const m = monthlyMap.get(mKey)!;
    m.revenue += n(inv.total);
    m.orders.add(inv.id);

    const weekStart = new Date(inv.invoice_date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const wKey = weekStart.toISOString().slice(0, 10);
    if (!weeklyMap.has(wKey)) weeklyMap.set(wKey, { revenue: 0, orders: new Set() });
    const w = weeklyMap.get(wKey)!;
    w.revenue += n(inv.total);
    w.orders.add(inv.id);
  }

  const monthlyRevenue: RevenueByPeriod[] = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([period, v]) => ({
      period,
      revenue: v.revenue,
      orders: v.orders.size,
      avg_order_value: v.orders.size ? v.revenue / v.orders.size : 0,
    }));

  const weeklyRevenue: RevenueByPeriod[] = [...weeklyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([period, v]) => ({
      period,
      revenue: v.revenue,
      orders: v.orders.size,
      avg_order_value: v.orders.size ? v.revenue / v.orders.size : 0,
    }));

  const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
  const revenueGrowth =
    prevMonth && prevMonth.revenue > 0
      ? ((currentMonth?.revenue || 0) - prevMonth.revenue) / prevMonth.revenue * 100
      : 0;

  // ── Product analytics from line items ────────────────────────────────────
  const productStats = new Map<
    string,
    { revenue: number; cases_sold: number; total_price: number; count: number }
  >();

  for (const item of invoiceItems) {
    const inv = invoiceMap.get(item.invoice_id);
    if (!inv) continue;
    const pid = item.product_id;
    if (!productStats.has(pid)) {
      productStats.set(pid, { revenue: 0, cases_sold: 0, total_price: 0, count: 0 });
    }
    const s = productStats.get(pid)!;
    s.revenue += n(item.total);
    s.cases_sold += n(item.quantity);
    s.total_price += n(item.unit_price);
    s.count += 1;
  }

  const maxCases = Math.max(...[...productStats.values()].map((s) => s.cases_sold), 1);

  const productAnalytics: ProductAnalytics[] = products.map((p) => {
    const s = productStats.get(p.id) || { revenue: 0, cases_sold: 0, total_price: 0, count: 0 };
    const avgPrice = s.count > 0 ? s.total_price / s.count : n(p.unit_price);
    const cost = n(p.cost_price);
    const margin = avgPrice > 0 ? ((avgPrice - cost) / avgPrice) * 100 : 0;
    const ratio = s.cases_sold / maxCases;
    const velocity: ProductAnalytics['velocity'] =
      ratio >= 0.6 ? 'fast' : ratio >= 0.2 ? 'medium' : 'slow';

    return {
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      category: p.category || 'Uncategorized',
      cases_sold: s.cases_sold,
      revenue: s.revenue,
      avg_price: avgPrice,
      profit_estimate: s.revenue * (margin / 100),
      profit_margin: margin,
      trend: 'stable' as const,
      velocity,
    };
  });

  // ── Customer analytics ─────────────────────────────────────────────────────
  const customerStats = new Map<
    string,
    { revenue: number; orders: number; lastDate: string; firstDate: string }
  >();

  for (const inv of invoices) {
    const cid = inv.customer_id;
    if (!customerStats.has(cid)) {
      customerStats.set(cid, {
        revenue: 0,
        orders: 0,
        lastDate: inv.invoice_date,
        firstDate: inv.invoice_date,
      });
    }
    const s = customerStats.get(cid)!;
    s.revenue += n(inv.total);
    s.orders += 1;
    if (inv.invoice_date > s.lastDate) s.lastDate = inv.invoice_date;
    if (inv.invoice_date < s.firstDate) s.firstDate = inv.invoice_date;
  }

  const customerAnalytics: CustomerAnalytics[] = customers.map((c) => {
    const s = customerStats.get(c.id);
    const managerName =
      c.sales_managers?.name ||
      (c.sales_manager_id ? managerMap.get(c.sales_manager_id)?.name : undefined) ||
      'Unassigned';
    const lastOrder = s?.lastDate || c.last_order_date || '';
    const firstOrder = s?.firstDate || c.first_order_date || lastOrder;
    const daysSince = lastOrder ? daysBetween(now, new Date(lastOrder)) : 999;
    const daysSinceFirst = firstOrder ? daysBetween(now, new Date(firstOrder)) : 999;

    let retention_status: CustomerAnalytics['retention_status'] = 'active';
    if (daysSinceFirst <= 30 && (s?.orders || 0) <= 2) retention_status = 'new';
    else if (daysSince > 90) retention_status = 'churned';
    else if (daysSince > 30) retention_status = 'at_risk';

    const orderCount = s?.orders || 0;
    const totalRevenue = s?.revenue || 0;

    return {
      customer_id: c.id,
      customer_name: c.name,
      city: c.city || '',
      state: c.state || '',
      sales_manager: managerName,
      total_revenue: totalRevenue,
      order_count: orderCount,
      avg_order_value: orderCount ? totalRevenue / orderCount : 0,
      last_order_date: lastOrder,
      first_order_date: firstOrder,
      days_since_last_order: daysSince,
      retention_status,
      trend: 'stable' as const,
    };
  });

  // ── Top products & customers (current month or all time) ───────────────────
  const currentMonthKey = currentMonth?.period;
  const currentMonthInvoices = new Set(
    invoices.filter((i) => monthKey(i.invoice_date) === currentMonthKey).map((i) => i.id)
  );

  const monthProductStats = new Map<string, { revenue: number; units: number }>();
  for (const item of invoiceItems) {
    if (currentMonthKey && !currentMonthInvoices.has(item.invoice_id)) continue;
    const pid = item.product_id;
    if (!monthProductStats.has(pid)) monthProductStats.set(pid, { revenue: 0, units: 0 });
    const s = monthProductStats.get(pid)!;
    s.revenue += n(item.total);
    s.units += n(item.quantity);
  }

  const topProducts: TopProduct[] = [...monthProductStats.entries()]
    .map(([product_id, s]) => {
      const p = productMap.get(product_id);
      return {
        product_id,
        product_name: p?.name || 'Unknown',
        sku: p?.sku || '',
        category: p?.category || 'Uncategorized',
        revenue: s.revenue,
        units_sold: s.units,
        rank: 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const monthCustomerStats = new Map<string, { revenue: number; orders: number }>();
  for (const inv of invoices) {
    if (currentMonthKey && monthKey(inv.invoice_date) !== currentMonthKey) continue;
    const cid = inv.customer_id;
    if (!monthCustomerStats.has(cid)) monthCustomerStats.set(cid, { revenue: 0, orders: 0 });
    const s = monthCustomerStats.get(cid)!;
    s.revenue += n(inv.total);
    s.orders += 1;
  }

  const topCustomers: TopCustomer[] = [...monthCustomerStats.entries()]
    .map(([customer_id, s]) => {
      const c = customerMap.get(customer_id);
      const managerName =
        c?.sales_managers?.name ||
        (c?.sales_manager_id ? managerMap.get(c.sales_manager_id)?.name : undefined) ||
        'Unassigned';
      return {
        customer_id,
        customer_name: c?.name || 'Unknown',
        city: c?.city || '',
        state: c?.state || '',
        sales_manager: managerName,
        revenue: s.revenue,
        orders: s.orders,
        rank: 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  // ── Revenue by category ────────────────────────────────────────────────────
  const categoryTotals = new Map<string, number>();
  for (const item of invoiceItems) {
    const p = productMap.get(item.product_id);
    const cat = p?.category || 'Uncategorized';
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + n(item.total));
  }
  const totalCategoryRevenue = [...categoryTotals.values()].reduce((a, b) => a + b, 0) || 1;
  const revenueByCategory: RevenueByCategory[] = [...categoryTotals.entries()]
    .map(([category, revenue]) => ({
      category,
      revenue,
      percentage: (revenue / totalCategoryRevenue) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Revenue by territory ───────────────────────────────────────────────────
  const territoryTotals = new Map<string, number>();
  for (const inv of invoices) {
    const c = customerMap.get(inv.customer_id);
    const territory =
      c?.sales_managers?.territory ||
      (c?.sales_manager_id ? managerMap.get(c.sales_manager_id)?.territory : undefined) ||
      'Unassigned';
    territoryTotals.set(territory, (territoryTotals.get(territory) || 0) + n(inv.total));
  }
  const revenueByTerritory = [...territoryTotals.entries()]
    .map(([territory, revenue]) => ({ territory, revenue, growth: 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Sales manager analytics ────────────────────────────────────────────────
  const salesManagerAnalytics: SalesManagerAnalytics[] = salesManagers.map((mgr) => {
    const mgrCustomers = customers.filter((c) => c.sales_manager_id === mgr.id);
    const mgrCustomerIds = new Set(mgrCustomers.map((c) => c.id));
    const mgrInvoices = invoices.filter((i) => mgrCustomerIds.has(i.customer_id));
    const totalRevenue = mgrInvoices.reduce((s, i) => s + n(i.total), 0);
    const activeCustomers = mgrCustomers.filter((c) => {
      const ca = customerAnalytics.find((x) => x.customer_id === c.id);
      return ca?.retention_status === 'active' || ca?.retention_status === 'new';
    }).length;

    return {
      manager_id: mgr.id,
      manager_name: mgr.name,
      territory: mgr.territory,
      total_revenue: totalRevenue,
      customer_count: mgrCustomers.length,
      active_customers: activeCustomers,
      new_customers: mgrCustomers.filter((c) => {
        const ca = customerAnalytics.find((x) => x.customer_id === c.id);
        return ca?.retention_status === 'new';
      }).length,
      reorder_opportunities: 0,
      revenue_growth: 0,
    };
  });

  // Include unassigned bucket if customers have no manager
  const unassignedCustomers = customers.filter((c) => !c.sales_manager_id);
  if (unassignedCustomers.length > 0 && !salesManagers.length) {
    const unassignedIds = new Set(unassignedCustomers.map((c) => c.id));
    const rev = invoices
      .filter((i) => unassignedIds.has(i.customer_id))
      .reduce((s, i) => s + n(i.total), 0);
    salesManagerAnalytics.push({
      manager_id: 'unassigned',
      manager_name: 'Unassigned',
      territory: 'Unassigned',
      total_revenue: rev,
      customer_count: unassignedCustomers.length,
      active_customers: unassignedCustomers.length,
      new_customers: 0,
      reorder_opportunities: 0,
      revenue_growth: 0,
    });
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  const inventoryByProduct = new Map(inventory.map((i) => [i.product_id, i]));
  const inventoryItems: InventoryItem[] = products.map((p) => {
    const inv = inventoryByProduct.get(p.id);
    const qty = n(inv?.quantity_on_hand);
    const reorderPoint = n(inv?.reorder_point) || 10;
    return {
      id: inv?.id || p.id,
      product_id: p.id,
      product_name: p.name,
      product_sku: p.sku,
      quantity_on_hand: qty,
      reorder_point: reorderPoint,
      reorder_quantity: n(inv?.reorder_quantity) || 50,
      warehouse_location: inv?.warehouse_location || undefined,
      last_updated: inv?.last_updated || new Date().toISOString(),
      status: inventoryStatus(qty, reorderPoint),
    };
  });

  const activeCustomers = customerAnalytics.filter(
    (c) => c.retention_status === 'active' || c.retention_status === 'new'
  ).length;

  const metrics: DashboardMetrics = {
    total_revenue: currentMonth?.revenue || invoices.reduce((s, i) => s + n(i.total), 0),
    total_customers: customers.filter((c) => c.is_active).length,
    total_products: products.length,
    total_orders: currentMonth?.orders || invoices.length,
    revenue_growth: revenueGrowth,
    customer_growth: 0,
    avg_order_value: currentMonth?.avg_order_value || 0,
    pending_reorders: inventoryItems.filter(
      (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
    ).length,
  };

  return {
    hasLiveData,
    counts: {
      customers: customers.length,
      products: products.length,
      invoices: invoices.length,
      salesManagers: salesManagers.length,
    },
    metrics,
    monthlyRevenue,
    weeklyRevenue,
    topProducts,
    topCustomers,
    revenueByCategory,
    revenueByTerritory,
    customerAnalytics,
    productAnalytics,
    salesManagerAnalytics,
    inventory: inventoryItems,
  };
}

let cache: { data: AnalyticsBundle; at: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function getAnalytics(): Promise<AnalyticsBundle> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  const base = await fetchBaseData();
  const data = buildAnalytics(base);
  cache = { data, at: Date.now() };
  return data;
}

export function invalidateAnalyticsCache() {
  cache = null;
}
