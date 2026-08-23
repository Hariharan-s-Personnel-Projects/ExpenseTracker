-- Catalog branding: brand color for public + internal catalog pages
-- Run once against your Supabase project

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT NULL;
