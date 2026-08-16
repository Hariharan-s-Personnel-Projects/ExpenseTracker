-- Migration: remove business_type column (product catalog access is now driven by industry = 'Retail')
-- Run this in Supabase SQL editor

ALTER TABLE businesses DROP COLUMN IF EXISTS business_type;
