// Core domain types for Makro Intelligence

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  cost_price: number;
  unit_of_measure: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  sales_manager_id: string;
  sales_manager_name?: string;
  is_active: boolean;
  first_order_date?: string;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesManager {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  territory: string;
  is_active: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  sales_manager_id: string;
  sales_manager_name?: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
  warehouse_location?: string;
  last_updated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

export interface AiInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  related_entity_type?: 'product' | 'customer' | 'sales_manager' | 'territory';
  related_entity_id?: string;
  related_entity_name?: string;
  metric_value?: number;
  metric_change?: number;
  is_read: boolean;
  created_at: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  records_processed: number;
  records_failed: number;
  error_message?: string;
  uploaded_at: string;
  processed_at?: string;
}

// Analytics aggregation types

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}

export interface ProductAnalytics {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  cases_sold: number;
  revenue: number;
  avg_price: number;
  profit_estimate: number;
  profit_margin: number;
  trend: 'up' | 'down' | 'stable';
  velocity: 'fast' | 'slow' | 'medium';
}

export interface CustomerAnalytics {
  customer_id: string;
  customer_name: string;
  city: string;
  state: string;
  sales_manager: string;
  total_revenue: number;
  order_count: number;
  avg_order_value: number;
  last_order_date: string;
  first_order_date: string;
  days_since_last_order: number;
  retention_status: 'active' | 'at_risk' | 'churned' | 'new';
  trend: 'growing' | 'declining' | 'stable';
}

export interface SalesManagerAnalytics {
  manager_id: string;
  manager_name: string;
  territory: string;
  total_revenue: number;
  customer_count: number;
  active_customers: number;
  new_customers: number;
  reorder_opportunities: number;
  top_product?: string;
  revenue_growth: number;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_customers: number;
  total_products: number;
  total_orders: number;
  revenue_growth: number;
  customer_growth: number;
  avg_order_value: number;
  pending_reorders: number;
}

export interface RevenueByCategory {
  category: string;
  revenue: number;
  percentage: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  revenue: number;
  units_sold: number;
  rank: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  city: string;
  state: string;
  sales_manager: string;
  revenue: number;
  orders: number;
  rank: number;
}

export interface DailyRevenuePoint {
  date: string;
  day: number;
  revenue: number;
  orders: number;
}

export interface MonthComparisonPoint {
  day: number;
  thisMonth: number | null;
  lastYear: number;
}

export interface MonthSummary {
  thisMonthLabel: string;
  lastMonthLabel: string;
  lastYearLabel: string;
  thisMonthRevenue: number;
  thisMonthOrders: number;
  lastMonthRevenue: number;
  lastYearMtdRevenue: number;
  lastYearTotalRevenue: number;
  yoyMtdGrowth: number;
  momGrowth: number;
}

export interface ProductSale {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ProductComparison {
  key: string;
  product_name: string;
  sku: string | null;
  category: string;
  revenue_2025: number;
  revenue_2026: number;
  units_2025: number;
  units_2026: number;
  revenue_delta_pct: number | null;
  status: 'matched' | 'only_2025' | 'only_2026';
}

export interface CategoryComparison {
  category: string;
  revenue_2025: number;
  revenue_2026: number;
}

export interface MonthlyComparisonPoint {
  label: string;            // 'Jan'
  revenue_2025: number;
  revenue_2026: number | null;
}

export interface YearComparisonSummary {
  label_2025: string;
  label_2026: string;
  revenue_2025: number;
  revenue_2026: number;
  orders_2025: number;
  orders_2026: number;
  matched_products: number;
  new_products: number;     // sold in 2026 but not 2025
  dropped_products: number; // sold in 2025 but not 2026
}

export interface YearComparison {
  summary: YearComparisonSummary;
  monthly: MonthlyComparisonPoint[];
  products: ProductComparison[];
  categories: CategoryComparison[];
}

export interface TopMarginProduct {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  revenue: number;
  profit: number;
  margin: number;
  rank: number;
}

// Upload / parse types

export interface ParsedInvoiceRow {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total: number;
  sales_manager?: string;
  city?: string;
  state?: string;
  category?: string;
}

export interface UploadResult {
  success: boolean;
  records_processed: number;
  records_failed: number;
  errors: string[];
  preview_data: ParsedInvoiceRow[];
}
