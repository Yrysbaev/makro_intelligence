/**
 * Fixed 2025 baseline, parsed once from the QuickBooks "Sales by Product/Service
 * Detail" export (data/2025_sales_detail.xlsx → src/data/sales-2025.json via
 * scripts/parse-sales-2025.py). Server-side only — never import into client code.
 *
 * QuickBooks now syncs 2026 only (see SYNC_START_DATE), so this file is the sole
 * source of 2025 numbers used for year-over-year comparisons.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ProductSale } from '@/types';

export interface Sale2025Line {
  date: string;        // YYYY-MM-DD
  invoiceNum: string;
  customer: string;
  region: string | null;
  product: string;
  sku: string | null;
  qty: number;
  price: number;
  amount: number;
}

interface Sales2025File {
  period: string;
  sourceFile: string;
  generatedAt: string;
  lineCount: number;
  totalAmount: number;
  lines: Sale2025Line[];
}

// Read at runtime (not a static import) so a 29k-row JSON does not blow up
// TypeScript inference or the client bundle. The file is traced into the
// serverless function via outputFileTracingIncludes in next.config.js.
let fileData: Sales2025File | null = null;
function loadFile(): Sales2025File {
  if (fileData) return fileData;
  const path = join(process.cwd(), 'data', 'sales-2025.json');
  fileData = JSON.parse(readFileSync(path, 'utf-8')) as Sales2025File;
  return fileData;
}

export const SALES_2025_PERIOD = '2025';

/** Normalize a product name for cross-year matching when SKU codes are absent. */
export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(deleted\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Match key for a product: prefer SKU code, fall back to normalized name. */
export function productKey(sku: string | null | undefined, name: string): string {
  if (sku && sku.trim()) return `sku:${sku.trim().toLowerCase()}`;
  return `name:${normalizeProductName(name)}`;
}

export interface Product2025 {
  key: string;
  name: string;
  sku: string | null;
  revenue: number;
  units: number;
}

export interface Customer2025 {
  name: string;
  region: string | null;
  revenue: number;
  orders: number;
}

export interface Baseline2025 {
  totalRevenue: number;
  monthlyRevenue: Map<string, { revenue: number; orders: number }>; // 'YYYY-MM'
  dailyByMonth: Map<string, Map<number, number>>;                    // 'YYYY-MM' -> day -> revenue
  productTotals: Map<string, Product2025>;
  customerTotals: Map<string, Customer2025>;
  productSales: Map<string, ProductSale[]>;
}

let cached: Baseline2025 | null = null;

export function getBaseline2025(): Baseline2025 {
  if (cached) return cached;

  const monthlyRevenue = new Map<string, { revenue: number; orders: number }>();
  const dailyByMonth = new Map<string, Map<number, number>>();
  const productTotals = new Map<string, Product2025>();
  const customerTotals = new Map<string, Customer2025>();
  const productSales = new Map<string, ProductSale[]>();
  const monthInvoiceSet = new Map<string, Set<string>>();
  const customerInvoiceSet = new Map<string, Set<string>>();
  let totalRevenue = 0;

  for (const l of loadFile().lines) {
    totalRevenue += l.amount;
    const month = l.date.slice(0, 7);
    const day = Number(l.date.slice(8, 10));

    // monthly revenue + distinct invoice count
    if (!monthlyRevenue.has(month)) monthlyRevenue.set(month, { revenue: 0, orders: 0 });
    monthlyRevenue.get(month)!.revenue += l.amount;
    if (!monthInvoiceSet.has(month)) monthInvoiceSet.set(month, new Set());
    monthInvoiceSet.get(month)!.add(l.invoiceNum);

    // daily revenue by month
    if (!dailyByMonth.has(month)) dailyByMonth.set(month, new Map());
    const dm = dailyByMonth.get(month)!;
    dm.set(day, (dm.get(day) || 0) + l.amount);

    // product totals
    const pKey = productKey(l.sku, l.product);
    if (!productTotals.has(pKey)) {
      productTotals.set(pKey, { key: pKey, name: l.product, sku: l.sku, revenue: 0, units: 0 });
    }
    const p = productTotals.get(pKey)!;
    p.revenue += l.amount;
    p.units += l.qty;

    // per-product sales detail (for drill-down)
    if (!productSales.has(pKey)) productSales.set(pKey, []);
    productSales.get(pKey)!.push({
      invoice_id: l.invoiceNum,
      invoice_number: l.invoiceNum,
      invoice_date: l.date,
      customer_name: l.region ? `${l.region}: ${l.customer}` : l.customer,
      quantity: l.qty,
      unit_price: l.price,
      total: l.amount,
    });

    // customer totals
    if (!customerTotals.has(l.customer)) {
      customerTotals.set(l.customer, { name: l.customer, region: l.region, revenue: 0, orders: 0 });
    }
    customerTotals.get(l.customer)!.revenue += l.amount;
    if (!customerInvoiceSet.has(l.customer)) customerInvoiceSet.set(l.customer, new Set());
    customerInvoiceSet.get(l.customer)!.add(l.invoiceNum);
  }

  for (const [month, set] of monthInvoiceSet) monthlyRevenue.get(month)!.orders = set.size;
  for (const [name, set] of customerInvoiceSet) customerTotals.get(name)!.orders = set.size;
  for (const list of productSales.values()) {
    list.sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
  }

  cached = { totalRevenue, monthlyRevenue, dailyByMonth, productTotals, customerTotals, productSales };
  return cached;
}
