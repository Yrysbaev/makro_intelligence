-- ============================================================
-- Makro Intelligence — QuickBooks Online Integration Migration
-- Run this after schema.sql
-- ============================================================

-- Store QBO connection tokens
CREATE TABLE IF NOT EXISTS intuit_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  realm_id VARCHAR(100) UNIQUE NOT NULL,   -- QBO company ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Add qbo_id columns for upsert conflict resolution
ALTER TABLE products      ADD COLUMN IF NOT EXISTS qbo_id VARCHAR(50) UNIQUE;
ALTER TABLE customers     ADD COLUMN IF NOT EXISTS qbo_id VARCHAR(50) UNIQUE;
ALTER TABLE invoices      ADD COLUMN IF NOT EXISTS qbo_id VARCHAR(50) UNIQUE;
ALTER TABLE sales_managers ADD COLUMN IF NOT EXISTS qbo_id VARCHAR(50) UNIQUE;

-- Add unique constraint on invoice_items for upsert
-- (invoice_id + product_id pair)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_invoice_items_invoice_product'
  ) THEN
    ALTER TABLE invoice_items
      ADD CONSTRAINT uq_invoice_items_invoice_product
      UNIQUE (invoice_id, product_id);
  END IF;
END $$;

-- RLS for intuit_connections (admin only — never expose tokens to client)
ALTER TABLE intuit_connections ENABLE ROW LEVEL SECURITY;
-- Only service role can access tokens (use SUPABASE_SERVICE_ROLE_KEY on server)
-- Client/anon role gets no access
