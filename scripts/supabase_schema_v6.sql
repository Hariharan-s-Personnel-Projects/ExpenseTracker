-- Migration v6: Friend contributions / expense reimbursements
-- Tracks money received from friends as their share of group expenses.
-- These amounts are subtracted from your effective monthly Daily Expense spending.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS expense_reimbursements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_name   TEXT NOT NULL,
  amount        NUMERIC NOT NULL CHECK (amount > 0),
  note          TEXT,
  received_date DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_reimbursements_user_date
  ON expense_reimbursements (user_id, received_date);

ALTER TABLE expense_reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reimbursements"
  ON expense_reimbursements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reimbursements"
  ON expense_reimbursements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reimbursements"
  ON expense_reimbursements FOR DELETE
  USING (auth.uid() = user_id);
