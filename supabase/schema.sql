-- ============================================================
-- Makro Intelligence — Supabase Database Schema
-- Wholesale Food Distribution Analytics Platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SALES MANAGERS
-- ============================================================
CREATE TABLE IF NOT EXISTS sales_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(20),
  territory VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(50) DEFAULT 'case',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(150),
  sales_manager_id UUID REFERENCES sales_managers(id),
  is_active BOOLEAN DEFAULT true,
  first_order_date DATE,
  last_order_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_sales_manager ON customers(sales_manager_id);
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_customers_is_active ON customers(is_active);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_manager_id UUID REFERENCES sales_managers(id),
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(12, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_sales_manager ON invoices(sales_manager_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================================
-- INVOICE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id),
  quantity_on_hand NUMERIC(10, 2) DEFAULT 0,
  reorder_point NUMERIC(10, 2) DEFAULT 0,
  reorder_quantity NUMERIC(10, 2) DEFAULT 0,
  warehouse_location VARCHAR(50),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory(product_id);

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('opportunity', 'risk', 'recommendation', 'alert')),
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  action TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  related_entity_name VARCHAR(200),
  metric_value NUMERIC(15, 2),
  metric_change NUMERIC(10, 2),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_type ON ai_insights(type);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_is_read ON ai_insights(is_read);

-- ============================================================
-- UPLOADED FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

-- Monthly revenue summary
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', invoice_date)::DATE AS month,
  TO_CHAR(invoice_date, 'YYYY-MM') AS period,
  SUM(total) AS revenue,
  COUNT(*) AS orders,
  AVG(total)::NUMERIC(10,2) AS avg_order_value
FROM invoices
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', invoice_date)
ORDER BY month;

-- Product revenue analytics
CREATE OR REPLACE VIEW product_revenue AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.category,
  SUM(ii.quantity) AS cases_sold,
  SUM(ii.total) AS revenue,
  AVG(ii.unit_price)::NUMERIC(10,2) AS avg_price,
  SUM(ii.total - (p.cost_price * ii.quantity))::NUMERIC(12,2) AS profit_estimate
FROM products p
LEFT JOIN invoice_items ii ON p.id = ii.product_id
LEFT JOIN invoices i ON ii.invoice_id = i.id AND i.status != 'cancelled'
GROUP BY p.id, p.name, p.sku, p.category
ORDER BY revenue DESC NULLS LAST;

-- Customer revenue analytics
CREATE OR REPLACE VIEW customer_revenue AS
SELECT
  c.id AS customer_id,
  c.name AS customer_name,
  c.city,
  c.state,
  sm.name AS sales_manager,
  sm.territory,
  SUM(i.total) AS total_revenue,
  COUNT(DISTINCT i.id) AS order_count,
  AVG(i.total)::NUMERIC(10,2) AS avg_order_value,
  MAX(i.invoice_date) AS last_order_date,
  MIN(i.invoice_date) AS first_order_date
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status != 'cancelled'
LEFT JOIN sales_managers sm ON c.sales_manager_id = sm.id
GROUP BY c.id, c.name, c.city, c.state, sm.name, sm.territory
ORDER BY total_revenue DESC NULLS LAST;

-- Sales manager revenue analytics
CREATE OR REPLACE VIEW sales_manager_revenue AS
SELECT
  sm.id AS manager_id,
  sm.name AS manager_name,
  sm.territory,
  SUM(i.total) AS total_revenue,
  COUNT(DISTINCT c.id) AS customer_count,
  COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) AS active_customers,
  COUNT(DISTINCT i.id) AS order_count
FROM sales_managers sm
LEFT JOIN customers c ON sm.id = c.sales_manager_id
LEFT JOIN invoices i ON c.id = i.customer_id AND i.status != 'cancelled'
GROUP BY sm.id, sm.name, sm.territory
ORDER BY total_revenue DESC NULLS LAST;

-- Inventory status view
CREATE OR REPLACE VIEW inventory_status AS
SELECT
  inv.id,
  inv.product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  inv.quantity_on_hand,
  inv.reorder_point,
  inv.reorder_quantity,
  inv.warehouse_location,
  inv.last_updated,
  CASE
    WHEN inv.quantity_on_hand = 0 THEN 'out_of_stock'
    WHEN inv.quantity_on_hand <= inv.reorder_point THEN 'low_stock'
    WHEN inv.quantity_on_hand >= inv.reorder_point * 3 THEN 'overstock'
    ELSE 'in_stock'
  END AS status
FROM inventory inv
JOIN products p ON inv.product_id = p.id;

-- ============================================================
-- ROW LEVEL SECURITY (basic setup)
-- ============================================================

ALTER TABLE sales_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON sales_managers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON uploaded_files FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated write" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON ai_insights FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON uploaded_files FOR ALL TO authenticated USING (true);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: update customer last_order_date on new invoice
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_last_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET
    last_order_date = NEW.invoice_date,
    first_order_date = COALESCE(first_order_date, NEW.invoice_date)
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_update_customer AFTER INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_customer_last_order();
