-- Add show_stock column to catalogue_share_links
-- Controls whether stock availability is visible on the public catalogue page
ALTER TABLE catalogue_share_links
ADD COLUMN IF NOT EXISTS show_stock BOOLEAN NOT NULL DEFAULT true;
