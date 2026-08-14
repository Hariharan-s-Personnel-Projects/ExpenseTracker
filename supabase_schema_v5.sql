-- Migration v5: Allow category quotas without a monthly limit (tracking-only)
-- A tracking-only category lets you group and measure spending without enforcing a cap.
-- Run this in your Supabase SQL editor.

ALTER TABLE category_quotas
  ALTER COLUMN monthly_limit DROP NOT NULL;
