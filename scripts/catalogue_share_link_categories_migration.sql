-- Per-link category filtering for share catalogue
-- Each link can optionally restrict which product categories are visible.
-- Empty = all categories shown (backwards compatible).
-- Run this migration once against your Supabase database.

CREATE TABLE IF NOT EXISTS catalogue_share_link_categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id     UUID NOT NULL REFERENCES catalogue_share_links(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  UNIQUE(link_id, category_id)
);

CREATE INDEX IF NOT EXISTS catalogue_share_link_categories_link_idx
  ON catalogue_share_link_categories(link_id);
