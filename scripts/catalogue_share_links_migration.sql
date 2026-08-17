-- Shareable product catalogue links
-- Run this migration once against your Supabase database
-- Requires: SUPABASE_SERVICE_ROLE_KEY env var for the public catalogue page

CREATE TABLE IF NOT EXISTS catalogue_share_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id),
  token        TEXT UNIQUE NOT NULL,
  label        TEXT NOT NULL,
  segment_id   UUID REFERENCES customer_segments(id) ON DELETE SET NULL,
  segment_name TEXT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ DEFAULT NULL,
  view_count   INT NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS catalogue_share_links_token_idx
  ON catalogue_share_links(token) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS catalogue_share_links_business_idx
  ON catalogue_share_links(business_id) WHERE deleted_at IS NULL;

-- Function to atomically increment view_count
CREATE OR REPLACE FUNCTION increment_catalogue_view_count(link_token TEXT)
RETURNS void AS $$
  UPDATE catalogue_share_links
  SET view_count = view_count + 1
  WHERE token = link_token AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;
