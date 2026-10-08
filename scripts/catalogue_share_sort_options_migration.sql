-- Add sort preference columns to catalogue_share_links
ALTER TABLE catalogue_share_links
  ADD COLUMN IF NOT EXISTS sort_by_newest   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_by_price_asc BOOLEAN NOT NULL DEFAULT false;
