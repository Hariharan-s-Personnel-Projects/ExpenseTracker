-- Add customer_name column to catalogue_share_links
-- This name is shown to the customer on the external product catalogue page
-- Run this migration once against your Supabase database

ALTER TABLE catalogue_share_links
  ADD COLUMN IF NOT EXISTS customer_name TEXT;