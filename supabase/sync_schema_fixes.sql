-- Run in Supabase SQL Editor if sync fails on phone length or duplicate SKUs
-- Safe to run multiple times

ALTER TABLE customers ALTER COLUMN phone TYPE VARCHAR(50);
ALTER TABLE sales_managers ALTER COLUMN phone TYPE VARCHAR(50);
