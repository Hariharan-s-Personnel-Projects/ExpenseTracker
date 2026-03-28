-- supabase_schema_v2.sql
-- Run this AFTER the original schema. These are ADD-ON tables for full finance tracking.

-- 8. Income Table — Track all sources of monthly income
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL,           -- e.g. "Salary", "Freelance", "Side Hustle", "Rental", "Dividends"
  amount NUMERIC NOT NULL,
  income_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Savings Table — Track savings goals and contributions
CREATE TABLE IF NOT EXISTS savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,             -- e.g. "Emergency Fund", "Vacation", "New Laptop"
  target_amount NUMERIC DEFAULT 0,
  saved_amount NUMERIC DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',  -- General, Emergency, Retirement, Goal-Based
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Savings Transactions — Individual deposits/withdrawals to savings goals
CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_id UUID REFERENCES savings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,        -- positive = deposit, negative = withdrawal
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  notes TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Investments Table — Track investment portfolio
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,             -- e.g. "NIFTY 50 Index Fund", "HDFC FD", "Bitcoin"
  type TEXT NOT NULL,             -- Stocks, Mutual Funds, FD, PPF, Gold, Crypto, Real Estate, Other
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  units NUMERIC,                  -- number of shares/units (optional)
  purchase_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Lending Table — Track money lent to or borrowed from people
CREATE TABLE IF NOT EXISTS lendings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  person_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),  -- money I gave vs received
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'settled')),
  settled_amount NUMERIC DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Lending Transactions — Track partial repayments
CREATE TABLE IF NOT EXISTS lending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lending_id UUID REFERENCES lendings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, income_date);
CREATE INDEX IF NOT EXISTS idx_savings_user ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_user ON savings_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_lendings_user ON lendings(user_id);
CREATE INDEX IF NOT EXISTS idx_lending_transactions_user ON lending_transactions(user_id);
