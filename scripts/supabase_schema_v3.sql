-- Migration v3: Daily Expense subcategory vocabulary table
-- Run this in your Supabase SQL editor before using the
-- "Daily Expense Subcategories" section on the Budget page.

CREATE TABLE IF NOT EXISTS expense_subcategories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT expense_subcategories_user_name_key UNIQUE (user_id, name)
);

-- Enable RLS (same pattern as other tables in this project)
ALTER TABLE expense_subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subcategories"
  ON expense_subcategories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subcategories"
  ON expense_subcategories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategories"
  ON expense_subcategories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategories"
  ON expense_subcategories FOR DELETE
  USING (auth.uid() = user_id);

-- Data migration: seed vocabulary from existing Daily Expense records
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
INSERT INTO expense_subcategories (user_id, name)
SELECT DISTINCT user_id, category
FROM expenses
WHERE major_category = 'Daily Expense'
  AND category IS NOT NULL
  AND category <> ''
  AND category <> 'Daily Expense'
ON CONFLICT (user_id, name) DO NOTHING;
