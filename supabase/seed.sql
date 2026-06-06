-- ============================================================
-- Makro Intelligence — Seed Data
-- Run this after schema.sql to populate demo data
-- ============================================================

-- Sales Managers
INSERT INTO sales_managers (id, name, email, phone, territory, is_active) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Maria Rodriguez', 'maria.r@makro.com', '555-0101', 'Southwest', true),
  ('11111111-0001-0001-0001-000000000002', 'James Thompson',  'james.t@makro.com', '555-0102', 'Northeast', true),
  ('11111111-0001-0001-0001-000000000003', 'Linda Chen',      'linda.c@makro.com', '555-0103', 'Northwest', true),
  ('11111111-0001-0001-0001-000000000004', 'Robert Davis',    'robert.d@makro.com','555-0104', 'Southeast', true),
  ('11111111-0001-0001-0001-000000000005', 'Sarah Wilson',    'sarah.w@makro.com', '555-0105', 'Midwest',   true)
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, sku, category, unit_price, cost_price, unit_of_measure) VALUES
  ('22222222-0001-0001-0001-000000000001', 'Roma Tomatoes',          'PRD-001', 'Produce',          24.99,  14.00, 'case'),
  ('22222222-0001-0001-0001-000000000002', 'Russet Potatoes',        'PRD-002', 'Produce',          18.50,   9.00, 'case'),
  ('22222222-0001-0001-0001-000000000003', 'Fresh Chicken Breast',   'MET-001', 'Meat & Poultry',   89.99,  58.00, 'case'),
  ('22222222-0001-0001-0001-000000000004', 'Ground Beef 80/20',      'MET-002', 'Meat & Poultry',  145.00,  98.00, 'case'),
  ('22222222-0001-0001-0001-000000000005', 'Mozzarella Cheese',      'DRY-001', 'Dairy',            67.50,  42.00, 'case'),
  ('22222222-0001-0001-0001-000000000006', 'Heavy Cream',            'DRY-002', 'Dairy',            38.00,  22.00, 'case'),
  ('22222222-0001-0001-0001-000000000007', 'All-Purpose Flour',      'DRY-003', 'Dry Goods',        22.00,  11.00, 'case'),
  ('22222222-0001-0001-0001-000000000008', 'Olive Oil Extra Virgin', 'DRY-004', 'Dry Goods',        95.00,  62.00, 'case'),
  ('22222222-0001-0001-0001-000000000009', 'Salmon Fillet',          'SEA-001', 'Seafood',         185.00, 130.00, 'case'),
  ('22222222-0001-0001-0001-000000000010', 'Shrimp 16/20',           'SEA-002', 'Seafood',         155.00, 108.00, 'case')
ON CONFLICT (id) DO NOTHING;

-- Customers
INSERT INTO customers (id, name, city, state, sales_manager_id, is_active) VALUES
  ('33333333-0001-0001-0001-000000000001', 'Golden Gate Restaurant',   'San Francisco', 'CA', '11111111-0001-0001-0001-000000000003', true),
  ('33333333-0001-0001-0001-000000000002', 'Riverside Hotel & Suites', 'Phoenix',       'AZ', '11111111-0001-0001-0001-000000000001', true),
  ('33333333-0001-0001-0001-000000000003', 'Metro Grocery Chain',      'New York',      'NY', '11111111-0001-0001-0001-000000000002', true),
  ('33333333-0001-0001-0001-000000000004', 'Sunshine Catering Co.',    'Miami',         'FL', '11111111-0001-0001-0001-000000000004', true),
  ('33333333-0001-0001-0001-000000000005', 'Chicago Steakhouse',       'Chicago',       'IL', '11111111-0001-0001-0001-000000000005', true)
ON CONFLICT (id) DO NOTHING;

-- Inventory
INSERT INTO inventory (product_id, quantity_on_hand, reorder_point, reorder_quantity, warehouse_location) VALUES
  ('22222222-0001-0001-0001-000000000001', 45,   50, 100, 'A-12'),
  ('22222222-0001-0001-0001-000000000002', 120,  60, 120, 'A-14'),
  ('22222222-0001-0001-0001-000000000003', 28,   40,  80, 'B-05'),
  ('22222222-0001-0001-0001-000000000004', 35,   30,  60, 'B-08'),
  ('22222222-0001-0001-0001-000000000005', 85,   40,  80, 'C-02'),
  ('22222222-0001-0001-0001-000000000006', 60,   25,  50, 'C-04'),
  ('22222222-0001-0001-0001-000000000007', 140,  50, 100, 'C-06'),
  ('22222222-0001-0001-0001-000000000008', 0,    20,  50, 'C-10'),
  ('22222222-0001-0001-0001-000000000009', 12,   20,  40, 'D-01'),
  ('22222222-0001-0001-0001-000000000010', 18,   15,  35, 'D-04')
ON CONFLICT (product_id) DO NOTHING;
