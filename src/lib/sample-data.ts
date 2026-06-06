// Sample data for Makro Intelligence demo
// Wholesale food distribution company

import type {
  Product, Customer, SalesManager, Invoice, InvoiceItem,
  InventoryItem, AiInsight, DashboardMetrics, RevenueByPeriod,
  ProductAnalytics, CustomerAnalytics, SalesManagerAnalytics,
  TopProduct, TopCustomer, RevenueByCategory,
} from '@/types';

export const sampleSalesManagers: SalesManager[] = [
  { id: 'sm1', name: 'Maria Rodriguez', email: 'maria.r@makro.com', phone: '555-0101', territory: 'Southwest', is_active: true, created_at: '2022-01-15' },
  { id: 'sm2', name: 'James Thompson', email: 'james.t@makro.com', phone: '555-0102', territory: 'Northeast', is_active: true, created_at: '2021-06-01' },
  { id: 'sm3', name: 'Linda Chen', email: 'linda.c@makro.com', phone: '555-0103', territory: 'Northwest', is_active: true, created_at: '2022-03-10' },
  { id: 'sm4', name: 'Robert Davis', email: 'robert.d@makro.com', phone: '555-0104', territory: 'Southeast', is_active: true, created_at: '2020-11-20' },
  { id: 'sm5', name: 'Sarah Wilson', email: 'sarah.w@makro.com', phone: '555-0105', territory: 'Midwest', is_active: true, created_at: '2023-01-05' },
];

export const sampleProducts: Product[] = [
  { id: 'p1', name: 'Roma Tomatoes', sku: 'PRD-001', category: 'Produce', unit_price: 24.99, cost_price: 14.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p2', name: 'Russet Potatoes', sku: 'PRD-002', category: 'Produce', unit_price: 18.50, cost_price: 9.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p3', name: 'Fresh Chicken Breast', sku: 'MET-001', category: 'Meat & Poultry', unit_price: 89.99, cost_price: 58.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p4', name: 'Ground Beef 80/20', sku: 'MET-002', category: 'Meat & Poultry', unit_price: 145.00, cost_price: 98.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p5', name: 'Mozzarella Cheese', sku: 'DRY-001', category: 'Dairy', unit_price: 67.50, cost_price: 42.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p6', name: 'Heavy Cream', sku: 'DRY-002', category: 'Dairy', unit_price: 38.00, cost_price: 22.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p7', name: 'All-Purpose Flour', sku: 'DRY-003', category: 'Dry Goods', unit_price: 22.00, cost_price: 11.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p8', name: 'Olive Oil Extra Virgin', sku: 'DRY-004', category: 'Dry Goods', unit_price: 95.00, cost_price: 62.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p9', name: 'Salmon Fillet', sku: 'SEA-001', category: 'Seafood', unit_price: 185.00, cost_price: 130.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p10', name: 'Shrimp 16/20', sku: 'SEA-002', category: 'Seafood', unit_price: 155.00, cost_price: 108.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p11', name: 'Yellow Onions', sku: 'PRD-003', category: 'Produce', unit_price: 15.00, cost_price: 7.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p12', name: 'Romaine Lettuce', sku: 'PRD-004', category: 'Produce', unit_price: 28.00, cost_price: 16.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p13', name: 'Cheddar Cheese', sku: 'DRY-005', category: 'Dairy', unit_price: 72.00, cost_price: 48.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p14', name: 'Butter Unsalted', sku: 'DRY-006', category: 'Dairy', unit_price: 55.00, cost_price: 36.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p15', name: 'Pasta Penne', sku: 'DRY-007', category: 'Dry Goods', unit_price: 32.00, cost_price: 18.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p16', name: 'Canola Oil', sku: 'DRY-008', category: 'Dry Goods', unit_price: 42.00, cost_price: 25.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p17', name: 'Broccoli Florets', sku: 'PRD-005', category: 'Produce', unit_price: 32.00, cost_price: 18.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p18', name: 'Pork Shoulder', sku: 'MET-003', category: 'Meat & Poultry', unit_price: 110.00, cost_price: 74.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p19', name: 'Chicken Wings', sku: 'MET-004', category: 'Meat & Poultry', unit_price: 78.00, cost_price: 50.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
  { id: 'p20', name: 'White Rice Long Grain', sku: 'DRY-009', category: 'Dry Goods', unit_price: 28.00, cost_price: 14.00, unit_of_measure: 'case', is_active: true, created_at: '2023-01-01', updated_at: '2024-06-01' },
];

export const sampleCustomers: Customer[] = [
  { id: 'c1', name: 'Golden Gate Restaurant', city: 'San Francisco', state: 'CA', sales_manager_id: 'sm3', is_active: true, created_at: '2022-03-15', updated_at: '2024-11-01', last_order_date: '2024-11-28' },
  { id: 'c2', name: 'Riverside Hotel & Suites', city: 'Phoenix', state: 'AZ', sales_manager_id: 'sm1', is_active: true, created_at: '2021-07-20', updated_at: '2024-11-01', last_order_date: '2024-11-25' },
  { id: 'c3', name: 'Metro Grocery Chain', city: 'New York', state: 'NY', sales_manager_id: 'sm2', is_active: true, created_at: '2020-05-10', updated_at: '2024-11-01', last_order_date: '2024-11-30' },
  { id: 'c4', name: 'Sunshine Catering Co.', city: 'Miami', state: 'FL', sales_manager_id: 'sm4', is_active: true, created_at: '2022-09-01', updated_at: '2024-11-01', last_order_date: '2024-11-20' },
  { id: 'c5', name: 'Chicago Steakhouse', city: 'Chicago', state: 'IL', sales_manager_id: 'sm5', is_active: true, created_at: '2021-02-14', updated_at: '2024-11-01', last_order_date: '2024-11-27' },
  { id: 'c6', name: 'Pacific Rim Bistro', city: 'Seattle', state: 'WA', sales_manager_id: 'sm3', is_active: true, created_at: '2023-01-10', updated_at: '2024-11-01', last_order_date: '2024-10-15' },
  { id: 'c7', name: 'Desert Rose Café', city: 'Las Vegas', state: 'NV', sales_manager_id: 'sm1', is_active: true, created_at: '2022-06-20', updated_at: '2024-11-01', last_order_date: '2024-11-22' },
  { id: 'c8', name: 'Harvest Table Inn', city: 'Boston', state: 'MA', sales_manager_id: 'sm2', is_active: true, created_at: '2021-11-05', updated_at: '2024-11-01', last_order_date: '2024-11-18' },
  { id: 'c9', name: 'Southern Comfort Kitchen', city: 'Atlanta', state: 'GA', sales_manager_id: 'sm4', is_active: true, created_at: '2023-03-15', updated_at: '2024-11-01', last_order_date: '2024-09-30' },
  { id: 'c10', name: 'Lakeside Resort', city: 'Minneapolis', state: 'MN', sales_manager_id: 'sm5', is_active: true, created_at: '2022-08-01', updated_at: '2024-11-01', last_order_date: '2024-11-10' },
  { id: 'c11', name: 'Austin BBQ House', city: 'Austin', state: 'TX', sales_manager_id: 'sm1', is_active: true, created_at: '2021-04-20', updated_at: '2024-11-01', last_order_date: '2024-11-29' },
  { id: 'c12', name: 'Harbor View Seafood', city: 'Portland', state: 'OR', sales_manager_id: 'sm3', is_active: true, created_at: '2022-12-01', updated_at: '2024-11-01', last_order_date: '2024-11-14' },
  { id: 'c13', name: 'Brooklyn Deli & Market', city: 'Brooklyn', state: 'NY', sales_manager_id: 'sm2', is_active: false, created_at: '2020-08-15', updated_at: '2024-11-01', last_order_date: '2024-08-01' },
  { id: 'c14', name: 'Tampa Bay Catering', city: 'Tampa', state: 'FL', sales_manager_id: 'sm4', is_active: true, created_at: '2023-05-10', updated_at: '2024-11-01', last_order_date: '2024-11-05' },
  { id: 'c15', name: 'Windy City Cafeteria', city: 'Chicago', state: 'IL', sales_manager_id: 'sm5', is_active: true, created_at: '2021-09-01', updated_at: '2024-11-01', last_order_date: '2024-11-26' },
];

// Monthly revenue data for the past 12 months
export const sampleMonthlyRevenue: RevenueByPeriod[] = [
  { period: '2023-12', revenue: 142500, orders: 89, avg_order_value: 1601 },
  { period: '2024-01', revenue: 138200, orders: 92, avg_order_value: 1502 },
  { period: '2024-02', revenue: 125800, orders: 78, avg_order_value: 1613 },
  { period: '2024-03', revenue: 155400, orders: 101, avg_order_value: 1539 },
  { period: '2024-04', revenue: 168700, orders: 108, avg_order_value: 1562 },
  { period: '2024-05', revenue: 172300, orders: 115, avg_order_value: 1498 },
  { period: '2024-06', revenue: 189500, orders: 122, avg_order_value: 1553 },
  { period: '2024-07', revenue: 195200, orders: 128, avg_order_value: 1525 },
  { period: '2024-08', revenue: 201800, orders: 135, avg_order_value: 1495 },
  { period: '2024-09', revenue: 188400, orders: 119, avg_order_value: 1583 },
  { period: '2024-10', revenue: 215600, orders: 142, avg_order_value: 1519 },
  { period: '2024-11', revenue: 228900, orders: 155, avg_order_value: 1477 },
];

export const sampleDashboardMetrics: DashboardMetrics = {
  total_revenue: 228900,
  total_customers: 15,
  total_products: 20,
  total_orders: 155,
  revenue_growth: 6.2,
  customer_growth: 8.5,
  avg_order_value: 1477,
  pending_reorders: 7,
};

export const sampleTopProducts: TopProduct[] = [
  { product_id: 'p3', product_name: 'Fresh Chicken Breast', sku: 'MET-001', category: 'Meat & Poultry', revenue: 48600, units_sold: 540, rank: 1 },
  { product_id: 'p9', product_name: 'Salmon Fillet', sku: 'SEA-001', category: 'Seafood', revenue: 39850, units_sold: 215, rank: 2 },
  { product_id: 'p4', product_name: 'Ground Beef 80/20', sku: 'MET-002', category: 'Meat & Poultry', revenue: 36250, units_sold: 250, rank: 3 },
  { product_id: 'p5', product_name: 'Mozzarella Cheese', sku: 'DRY-001', category: 'Dairy', revenue: 30375, units_sold: 450, rank: 4 },
  { product_id: 'p8', product_name: 'Olive Oil Extra Virgin', sku: 'DRY-004', category: 'Dry Goods', revenue: 28500, units_sold: 300, rank: 5 },
  { product_id: 'p10', product_name: 'Shrimp 16/20', sku: 'SEA-002', category: 'Seafood', revenue: 27900, units_sold: 180, rank: 6 },
  { product_id: 'p18', product_name: 'Pork Shoulder', sku: 'MET-003', category: 'Meat & Poultry', revenue: 24200, units_sold: 220, rank: 7 },
  { product_id: 'p1', product_name: 'Roma Tomatoes', sku: 'PRD-001', category: 'Produce', revenue: 22491, units_sold: 900, rank: 8 },
];

export const sampleTopCustomers: TopCustomer[] = [
  { customer_id: 'c3', customer_name: 'Metro Grocery Chain', city: 'New York', state: 'NY', sales_manager: 'James Thompson', revenue: 68400, orders: 28, rank: 1 },
  { customer_id: 'c5', customer_name: 'Chicago Steakhouse', city: 'Chicago', state: 'IL', sales_manager: 'Sarah Wilson', revenue: 52100, orders: 22, rank: 2 },
  { customer_id: 'c2', customer_name: 'Riverside Hotel & Suites', city: 'Phoenix', state: 'AZ', sales_manager: 'Maria Rodriguez', revenue: 48750, orders: 20, rank: 3 },
  { customer_id: 'c11', customer_name: 'Austin BBQ House', city: 'Austin', state: 'TX', sales_manager: 'Maria Rodriguez', revenue: 41200, orders: 18, rank: 4 },
  { customer_id: 'c1', customer_name: 'Golden Gate Restaurant', city: 'San Francisco', state: 'CA', sales_manager: 'Linda Chen', revenue: 38900, orders: 17, rank: 5 },
];

export const sampleRevenueByCategory: RevenueByCategory[] = [
  { category: 'Meat & Poultry', revenue: 89420, percentage: 32.4 },
  { category: 'Seafood', revenue: 62380, percentage: 22.6 },
  { category: 'Dairy', revenue: 48910, percentage: 17.7 },
  { category: 'Dry Goods', revenue: 43200, percentage: 15.6 },
  { category: 'Produce', revenue: 32300, percentage: 11.7 },
];

export const sampleProductAnalytics: ProductAnalytics[] = [
  { product_id: 'p3', product_name: 'Fresh Chicken Breast', sku: 'MET-001', category: 'Meat & Poultry', cases_sold: 540, revenue: 48600, avg_price: 89.99, profit_estimate: 17196, profit_margin: 35.4, trend: 'up', velocity: 'fast' },
  { product_id: 'p9', product_name: 'Salmon Fillet', sku: 'SEA-001', category: 'Seafood', cases_sold: 215, revenue: 39850, avg_price: 185.00, profit_estimate: 11825, profit_margin: 29.7, trend: 'up', velocity: 'fast' },
  { product_id: 'p4', product_name: 'Ground Beef 80/20', sku: 'MET-002', category: 'Meat & Poultry', cases_sold: 250, revenue: 36250, avg_price: 145.00, profit_estimate: 11750, profit_margin: 32.4, trend: 'stable', velocity: 'fast' },
  { product_id: 'p5', product_name: 'Mozzarella Cheese', sku: 'DRY-001', category: 'Dairy', cases_sold: 450, revenue: 30375, avg_price: 67.50, profit_estimate: 11475, profit_margin: 37.8, trend: 'up', velocity: 'fast' },
  { product_id: 'p8', product_name: 'Olive Oil Extra Virgin', sku: 'DRY-004', category: 'Dry Goods', cases_sold: 300, revenue: 28500, avg_price: 95.00, profit_estimate: 9900, profit_margin: 34.7, trend: 'stable', velocity: 'medium' },
  { product_id: 'p10', product_name: 'Shrimp 16/20', sku: 'SEA-002', category: 'Seafood', cases_sold: 180, revenue: 27900, avg_price: 155.00, profit_estimate: 8460, profit_margin: 30.3, trend: 'up', velocity: 'medium' },
  { product_id: 'p1', product_name: 'Roma Tomatoes', sku: 'PRD-001', category: 'Produce', cases_sold: 900, revenue: 22491, avg_price: 24.99, profit_estimate: 9891, profit_margin: 44.0, trend: 'stable', velocity: 'fast' },
  { product_id: 'p2', product_name: 'Russet Potatoes', sku: 'PRD-002', category: 'Produce', cases_sold: 600, revenue: 11100, avg_price: 18.50, profit_estimate: 5700, profit_margin: 51.4, trend: 'down', velocity: 'medium' },
  { product_id: 'p17', product_name: 'Broccoli Florets', sku: 'PRD-005', category: 'Produce', cases_sold: 120, revenue: 3840, avg_price: 32.00, profit_estimate: 1680, profit_margin: 43.8, trend: 'down', velocity: 'slow' },
  { product_id: 'p16', product_name: 'Canola Oil', sku: 'DRY-008', category: 'Dry Goods', cases_sold: 85, revenue: 3570, avg_price: 42.00, profit_estimate: 1445, profit_margin: 40.5, trend: 'down', velocity: 'slow' },
];

export const sampleCustomerAnalytics: CustomerAnalytics[] = [
  { customer_id: 'c3', customer_name: 'Metro Grocery Chain', city: 'New York', state: 'NY', sales_manager: 'James Thompson', total_revenue: 68400, order_count: 28, avg_order_value: 2443, last_order_date: '2024-11-30', first_order_date: '2020-05-10', days_since_last_order: 6, retention_status: 'active', trend: 'growing' },
  { customer_id: 'c5', customer_name: 'Chicago Steakhouse', city: 'Chicago', state: 'IL', sales_manager: 'Sarah Wilson', total_revenue: 52100, order_count: 22, avg_order_value: 2368, last_order_date: '2024-11-27', first_order_date: '2021-02-14', days_since_last_order: 9, retention_status: 'active', trend: 'stable' },
  { customer_id: 'c2', customer_name: 'Riverside Hotel & Suites', city: 'Phoenix', state: 'AZ', sales_manager: 'Maria Rodriguez', total_revenue: 48750, order_count: 20, avg_order_value: 2438, last_order_date: '2024-11-25', first_order_date: '2021-07-20', days_since_last_order: 11, retention_status: 'active', trend: 'growing' },
  { customer_id: 'c11', customer_name: 'Austin BBQ House', city: 'Austin', state: 'TX', sales_manager: 'Maria Rodriguez', total_revenue: 41200, order_count: 18, avg_order_value: 2289, last_order_date: '2024-11-29', first_order_date: '2021-04-20', days_since_last_order: 7, retention_status: 'active', trend: 'growing' },
  { customer_id: 'c9', customer_name: 'Southern Comfort Kitchen', city: 'Atlanta', state: 'GA', sales_manager: 'Robert Davis', total_revenue: 18200, order_count: 9, avg_order_value: 2022, last_order_date: '2024-09-30', first_order_date: '2023-03-15', days_since_last_order: 61, retention_status: 'churned', trend: 'declining' },
  { customer_id: 'c13', customer_name: 'Brooklyn Deli & Market', city: 'Brooklyn', state: 'NY', sales_manager: 'James Thompson', total_revenue: 12400, order_count: 6, avg_order_value: 2067, last_order_date: '2024-08-01', first_order_date: '2020-08-15', days_since_last_order: 121, retention_status: 'churned', trend: 'declining' },
];

export const sampleSalesManagerAnalytics: SalesManagerAnalytics[] = [
  { manager_id: 'sm2', manager_name: 'James Thompson', territory: 'Northeast', total_revenue: 89500, customer_count: 3, active_customers: 2, new_customers: 0, reorder_opportunities: 2, top_product: 'Fresh Chicken Breast', revenue_growth: 12.4 },
  { manager_id: 'sm1', manager_name: 'Maria Rodriguez', territory: 'Southwest', total_revenue: 98200, customer_count: 3, active_customers: 3, new_customers: 1, reorder_opportunities: 3, top_product: 'Ground Beef 80/20', revenue_growth: 15.8 },
  { manager_id: 'sm3', manager_name: 'Linda Chen', territory: 'Northwest', total_revenue: 72400, customer_count: 3, active_customers: 3, new_customers: 1, reorder_opportunities: 1, top_product: 'Salmon Fillet', revenue_growth: 8.2 },
  { manager_id: 'sm4', manager_name: 'Robert Davis', territory: 'Southeast', total_revenue: 58100, customer_count: 3, active_customers: 2, new_customers: 1, reorder_opportunities: 2, top_product: 'Shrimp 16/20', revenue_growth: -3.5 },
  { manager_id: 'sm5', manager_name: 'Sarah Wilson', territory: 'Midwest', total_revenue: 65800, customer_count: 2, active_customers: 2, new_customers: 0, reorder_opportunities: 1, top_product: 'Mozzarella Cheese', revenue_growth: 6.1 },
];

export const sampleInventory: InventoryItem[] = [
  { id: 'inv1', product_id: 'p1', product_name: 'Roma Tomatoes', product_sku: 'PRD-001', quantity_on_hand: 45, reorder_point: 50, reorder_quantity: 100, warehouse_location: 'A-12', last_updated: '2024-11-30', status: 'low_stock' },
  { id: 'inv2', product_id: 'p2', product_name: 'Russet Potatoes', product_sku: 'PRD-002', quantity_on_hand: 120, reorder_point: 60, reorder_quantity: 120, warehouse_location: 'A-14', last_updated: '2024-11-30', status: 'in_stock' },
  { id: 'inv3', product_id: 'p3', product_name: 'Fresh Chicken Breast', product_sku: 'MET-001', quantity_on_hand: 28, reorder_point: 40, reorder_quantity: 80, warehouse_location: 'B-05', last_updated: '2024-11-30', status: 'low_stock' },
  { id: 'inv4', product_id: 'p4', product_name: 'Ground Beef 80/20', product_sku: 'MET-002', quantity_on_hand: 35, reorder_point: 30, reorder_quantity: 60, warehouse_location: 'B-08', last_updated: '2024-11-30', status: 'in_stock' },
  { id: 'inv5', product_id: 'p5', product_name: 'Mozzarella Cheese', product_sku: 'DRY-001', quantity_on_hand: 85, reorder_point: 40, reorder_quantity: 80, warehouse_location: 'C-02', last_updated: '2024-11-30', status: 'in_stock' },
  { id: 'inv6', product_id: 'p8', product_name: 'Olive Oil Extra Virgin', product_sku: 'DRY-004', quantity_on_hand: 0, reorder_point: 20, reorder_quantity: 50, warehouse_location: 'C-10', last_updated: '2024-11-30', status: 'out_of_stock' },
  { id: 'inv7', product_id: 'p9', product_name: 'Salmon Fillet', product_sku: 'SEA-001', quantity_on_hand: 12, reorder_point: 20, reorder_quantity: 40, warehouse_location: 'D-01', last_updated: '2024-11-30', status: 'low_stock' },
  { id: 'inv8', product_id: 'p10', product_name: 'Shrimp 16/20', product_sku: 'SEA-002', quantity_on_hand: 18, reorder_point: 15, reorder_quantity: 35, warehouse_location: 'D-04', last_updated: '2024-11-30', status: 'in_stock' },
  { id: 'inv9', product_id: 'p11', product_name: 'Yellow Onions', product_sku: 'PRD-003', quantity_on_hand: 200, reorder_point: 60, reorder_quantity: 120, warehouse_location: 'A-16', last_updated: '2024-11-30', status: 'overstock' },
  { id: 'inv10', product_id: 'p15', product_name: 'Pasta Penne', product_sku: 'DRY-007', quantity_on_hand: 0, reorder_point: 30, reorder_quantity: 60, warehouse_location: 'C-14', last_updated: '2024-11-30', status: 'out_of_stock' },
];

export const sampleAiInsights: AiInsight[] = [
  {
    id: 'ai1',
    type: 'opportunity',
    priority: 'high',
    title: 'Reorder Salmon Fillet Immediately',
    description: 'Salmon Fillet (SEA-001) stock is critically low at 12 cases, below the reorder point of 20. Based on recent sales velocity of ~18 cases/month, you may run out within 3 weeks.',
    action: 'Place reorder for 40 cases from supplier',
    related_entity_type: 'product',
    related_entity_id: 'p9',
    related_entity_name: 'Salmon Fillet',
    metric_value: 12,
    is_read: false,
    created_at: '2024-11-30',
  },
  {
    id: 'ai2',
    type: 'risk',
    priority: 'high',
    title: 'Customer at Risk of Churning',
    description: 'Southern Comfort Kitchen (Atlanta, GA) has not placed an order in 61 days, exceeding the 60-day churn threshold. They previously ordered every 3 weeks on average.',
    action: 'Assign Robert Davis to follow up immediately with a special offer',
    related_entity_type: 'customer',
    related_entity_id: 'c9',
    related_entity_name: 'Southern Comfort Kitchen',
    metric_value: 61,
    is_read: false,
    created_at: '2024-11-30',
  },
  {
    id: 'ai3',
    type: 'recommendation',
    priority: 'high',
    title: 'Promote Chicken Breast to Underserved Accounts',
    description: 'Fresh Chicken Breast is your #1 revenue product with 35% margin, but 6 of your 15 customers have never ordered it. Cross-selling opportunity estimated at $12,000 additional monthly revenue.',
    action: 'Create targeted promotion for Harbor View Seafood, Desert Rose Café, and Lakeside Resort',
    related_entity_type: 'product',
    related_entity_id: 'p3',
    related_entity_name: 'Fresh Chicken Breast',
    metric_value: 12000,
    is_read: false,
    created_at: '2024-11-29',
  },
  {
    id: 'ai4',
    type: 'opportunity',
    priority: 'medium',
    title: 'Metro Grocery Chain — Upsell Opportunity',
    description: 'Your top customer Metro Grocery Chain has increased orders by 18% over the last quarter. They have strong purchasing patterns in Meat & Poultry but have never ordered Seafood products.',
    action: 'Present Salmon and Shrimp pricing to Metro Grocery Chain buyer',
    related_entity_type: 'customer',
    related_entity_id: 'c3',
    related_entity_name: 'Metro Grocery Chain',
    metric_value: 18,
    is_read: false,
    created_at: '2024-11-29',
  },
  {
    id: 'ai5',
    type: 'alert',
    priority: 'medium',
    title: 'Olive Oil Out of Stock',
    description: 'Olive Oil Extra Virgin (DRY-004) is completely out of stock. This product generates $28,500/month in revenue. Lost sales risk if not restocked within 48 hours.',
    action: 'Contact supplier for emergency restock — standard reorder is 50 cases',
    related_entity_type: 'product',
    related_entity_id: 'p8',
    related_entity_name: 'Olive Oil Extra Virgin',
    metric_value: 28500,
    is_read: true,
    created_at: '2024-11-30',
  },
  {
    id: 'ai6',
    type: 'risk',
    priority: 'medium',
    title: 'Declining Sales: Broccoli Florets',
    description: 'Broccoli Florets sales have dropped 42% over the last 3 months. Monthly revenue decreased from $6,600 to $3,840. Review pricing and supplier quality.',
    action: 'Evaluate whether to keep product or replace with higher-demand vegetable SKU',
    related_entity_type: 'product',
    related_entity_id: 'p17',
    related_entity_name: 'Broccoli Florets',
    metric_value: -42,
    is_read: false,
    created_at: '2024-11-28',
  },
  {
    id: 'ai7',
    type: 'recommendation',
    priority: 'medium',
    title: 'Robert Davis Territory Needs Attention',
    description: 'The Southeast territory (Robert Davis) is the only region with negative revenue growth (-3.5%). Brooklyn Deli & Market has churned, and Southern Comfort Kitchen is at risk.',
    action: 'Schedule territory review meeting and develop win-back strategy for Southeast',
    related_entity_type: 'sales_manager',
    related_entity_id: 'sm4',
    related_entity_name: 'Robert Davis',
    metric_value: -3.5,
    is_read: false,
    created_at: '2024-11-28',
  },
  {
    id: 'ai8',
    type: 'opportunity',
    priority: 'low',
    title: 'Austin BBQ House — Strong Growth',
    description: 'Austin BBQ House has grown revenue by 28% year-over-year, making them a high-value account. Consider offering a volume discount to lock in a longer-term agreement.',
    action: 'Offer 5% volume discount for 12-month contract commitment',
    related_entity_type: 'customer',
    related_entity_id: 'c11',
    related_entity_name: 'Austin BBQ House',
    metric_value: 28,
    is_read: true,
    created_at: '2024-11-27',
  },
];

// Weekly revenue for detailed view
export const sampleWeeklyRevenue: RevenueByPeriod[] = [
  { period: 'Week 43', revenue: 52400, orders: 34, avg_order_value: 1541 },
  { period: 'Week 44', revenue: 55800, orders: 37, avg_order_value: 1508 },
  { period: 'Week 45', revenue: 49200, orders: 31, avg_order_value: 1587 },
  { period: 'Week 46', revenue: 62100, orders: 41, avg_order_value: 1515 },
  { period: 'Week 47', revenue: 58900, orders: 39, avg_order_value: 1510 },
  { period: 'Week 48', revenue: 67500, orders: 45, avg_order_value: 1500 },
];

// Revenue by territory
export const sampleRevenueByTerritory = [
  { territory: 'Southwest', revenue: 98200, growth: 15.8 },
  { territory: 'Northeast', revenue: 89500, growth: 12.4 },
  { territory: 'Midwest', revenue: 65800, growth: 6.1 },
  { territory: 'Northwest', revenue: 72400, growth: 8.2 },
  { territory: 'Southeast', revenue: 58100, growth: -3.5 },
];
