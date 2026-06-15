-- ============================================================
-- Makro Intelligence — Remove demo/seed data
-- Run this once in the Supabase SQL editor to delete the demo rows
-- created by seed.sql. Safe: it targets ONLY the fixed demo UUID
-- prefixes used in seed.sql, never QuickBooks-synced rows (which use
-- random UUIDs).
-- ============================================================

-- Children first (foreign keys), then parents.
DELETE FROM invoice_items
  WHERE product_id::text LIKE '22222222-0001-%'
     OR invoice_id IN (SELECT id FROM invoices WHERE customer_id::text LIKE '33333333-0001-%');

DELETE FROM invoices      WHERE customer_id::text LIKE '33333333-0001-%';
DELETE FROM inventory     WHERE product_id::text  LIKE '22222222-0001-%';
DELETE FROM customers     WHERE id::text          LIKE '33333333-0001-%';
DELETE FROM products      WHERE id::text          LIKE '22222222-0001-%';
DELETE FROM sales_managers WHERE id::text         LIKE '11111111-0001-%';

-- Optional: also remove any leftover pre-2026 invoices from earlier sync
-- attempts so only 2026 QuickBooks data remains live (2025 comes from the
-- bundled file baseline). Uncomment to apply.
-- DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_date < '2026-01-01');
-- DELETE FROM invoices WHERE invoice_date < '2026-01-01';
