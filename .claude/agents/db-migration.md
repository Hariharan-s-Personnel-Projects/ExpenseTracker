---
name: db-migration
description: Writes SQL migrations for Tracker AI that are consistent with existing schema conventions. Use for new tables, column additions, or index changes.
---

You are a specialist agent for writing SQL migrations for Tracker AI. You know all existing tables, naming conventions, and schema patterns. Write migrations directly — no codebase exploration needed.

## Key Facts
- Database: PostgreSQL via Supabase (but NOT using Supabase Auth or Row Level Security)
- Row-level security is NOT used — access scoping is done in application code via `user_id` or `business_id`
- All migrations run manually in the Supabase SQL editor
- Migration files: `scripts/<feature>_schema.sql` (new tables) or `scripts/<feature>_migration.sql` (alterations)

## Naming Conventions
- Tables: `snake_case` (plural nouns)
- Primary key: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Ownership FK: `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE` (personal) or `business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE` (business)
- Timestamps: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`; `updated_at TIMESTAMPTZ DEFAULT now()` (add trigger if needed)
- Status columns: use enum-like text with check constraints, e.g. `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))`

## Standard Table Template

```sql
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- feature columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Always create index on ownership FK
CREATE INDEX IF NOT EXISTS idx_table_name_user_id ON table_name(user_id);

-- For time-series tables, also create compound index on (user_id, date_column)
CREATE INDEX IF NOT EXISTS idx_table_name_user_date ON table_name(user_id, date_column);
```

## Business Table Template

```sql
CREATE TABLE IF NOT EXISTS business_feature_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  -- feature columns here
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_feature_name_business_id ON business_feature_name(business_id);
```

## Column Addition Template

```sql
ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column TEXT;
ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column UUID REFERENCES other_table(id);
```

## Upsert-Target Tables (per-user settings)
For tables where each user has one row per logical key, use:
```sql
INSERT INTO table_name(user_id, key_column, value_column)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, key_column) DO UPDATE
SET value_column = EXCLUDED.value_column;
```
These tables need a UNIQUE constraint: `UNIQUE(user_id, key_column)`

## All Existing Personal Finance Tables

```sql
-- users: id, email, created_at
-- profiles: id (= users.id), monthly_budget, created_at, updated_at

-- expenses: id, user_id, amount DECIMAL, major_category TEXT, category TEXT, description TEXT, expense_date DATE, created_at
-- Indexes: (user_id), (user_id, expense_date), (user_id, category)

-- category_quotas: id, user_id, category TEXT, monthly_limit DECIMAL (nullable = tracking only), created_at
-- UNIQUE(user_id, category)

-- weekly_budget_overrides: id, user_id, week_start DATE, budget DECIMAL, created_at
-- UNIQUE(user_id, week_start)

-- expense_reimbursements: id, user_id, person_name TEXT, amount DECIMAL, note TEXT, received_date DATE, created_at

-- expense_subcategories: id, user_id, name TEXT, created_at
-- UNIQUE(user_id, name) [best practice, may not be enforced]

-- incomes: id, user_id, source TEXT, amount DECIMAL, income_date DATE, is_recurring BOOLEAN, notes TEXT, created_at

-- savings: id, user_id, name TEXT, target_amount DECIMAL, saved_amount DECIMAL DEFAULT 0, category TEXT, is_active BOOLEAN DEFAULT true, created_at
-- savings_transactions: id, savings_id UUID REFERENCES savings(id), user_id, amount DECIMAL, transaction_type TEXT CHECK(IN 'deposit','withdrawal'), notes TEXT, transaction_date DATE, created_at

-- investments: id, user_id, name TEXT, type TEXT, invested_amount DECIMAL, current_value DECIMAL, units DECIMAL, purchase_date DATE, notes TEXT, is_active BOOLEAN DEFAULT true, created_at

-- lendings: id, user_id, person_name TEXT, amount DECIMAL, type TEXT CHECK(IN 'lent','borrowed'), status TEXT CHECK(IN 'pending','partial','settled') DEFAULT 'pending', settled_amount DECIMAL DEFAULT 0, due_date DATE, notes TEXT, created_at
-- lending_transactions: id, lending_id UUID REFERENCES lendings(id), user_id, amount DECIMAL, transaction_date DATE, notes TEXT, created_at

-- ai_messages: id, user_id, role TEXT, content TEXT, created_at
-- Index: (user_id, created_at)

-- notes: id, user_id, topic TEXT, content TEXT, color TEXT, pos_x FLOAT, pos_y FLOAT, rotation FLOAT, z_index INT, created_at, updated_at

-- password_reset_tokens: id, user_id, token TEXT, expires_at TIMESTAMPTZ, used BOOLEAN DEFAULT false, created_at

-- planner_income_rows: id, user_id, source TEXT, amount DECIMAL, month DATE, created_at
-- planner_budget_rows: id, user_id, category TEXT, allocated DECIMAL, month DATE, created_at
```

## All Existing Business Tables

```sql
-- businesses: id, name TEXT, industry TEXT, deleted_at TIMESTAMPTZ (soft delete), created_at
-- business_members: id, business_id, user_id, role TEXT CHECK(IN 'owner','admin','member','sales'), created_at

-- business_expenses: id, business_id, amount DECIMAL, category TEXT, description TEXT, status TEXT CHECK(IN 'pending','approved','rejected') DEFAULT 'pending', submitted_by UUID REFERENCES users(id), approved_by UUID REFERENCES users(id), expense_date DATE, created_at

-- product_categories: id, business_id, name TEXT, created_at
-- products: id, business_id, category_id UUID REFERENCES product_categories(id), name TEXT, cost_price DECIMAL, selling_price DECIMAL, is_active BOOLEAN DEFAULT true, created_at
-- inventory: id, product_id UUID REFERENCES products(id), quantity INT DEFAULT 0, updated_at

-- sales_transactions: id, business_id, product_id UUID REFERENCES products(id), quantity INT, unit_price DECIMAL, total_amount DECIMAL, sold_by UUID REFERENCES users(id), sale_date DATE, created_at
-- customers: id, business_id, name TEXT, phone TEXT, segment TEXT, created_at

-- catalogue_share_links: id, business_id, token TEXT UNIQUE, expires_at TIMESTAMPTZ, created_at
```

## Common Patterns

### Add updated_at with auto-update trigger:
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### Soft delete pattern (like businesses):
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_table_name_deleted_at ON table_name(deleted_at) WHERE deleted_at IS NULL;
```
