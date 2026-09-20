-- Add hide_out_of_stock column to catalogue_share_links
-- When enabled, out-of-stock products are hidden from the public catalogue page
ALTER TABLE catalogue_share_links
ADD COLUMN IF NOT EXISTS hide_out_of_stock BOOLEAN NOT NULL DEFAULT false;
