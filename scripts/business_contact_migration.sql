-- Contact information columns for the businesses table
-- Run this migration once against your Supabase database

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_phone    TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_email    TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website          TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line1    TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line2    TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city             TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS state            TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country          TEXT DEFAULT NULL;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS postal_code      TEXT DEFAULT NULL;
