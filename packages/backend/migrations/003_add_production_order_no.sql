-- Migration: Add production_order_no column for deduplication feature
-- This column stores the Production Order Number (e.g., RR11541B, RR11541E)
-- Used to identify and deduplicate orders across different reporting days

-- Add production_order_no column to dashboard_data
ALTER TABLE dashboard_data ADD COLUMN IF NOT EXISTS production_order_no VARCHAR(100);

-- Create index for efficient deduplication queries
CREATE INDEX IF NOT EXISTS idx_dashboard_data_production_order_no ON dashboard_data(production_order_no);

-- Create composite index for deduplication (production_order_no + reporting_day)
CREATE INDEX IF NOT EXISTS idx_dashboard_data_dedup ON dashboard_data(production_order_no, reporting_day DESC);
