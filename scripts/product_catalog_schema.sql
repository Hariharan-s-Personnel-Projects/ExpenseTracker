-- Product Catalog: per-business product categories with dynamic cost columns
-- Run after business_schema.sql

-- Product categories (one per business, e.g. "Electronics", "Apparel")
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Custom cost sub-columns per category (e.g. "Product Cost", "Travel Cost")
CREATE TABLE IF NOT EXISTS product_cost_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products within a category
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cost values: one row per (product × cost_column)
CREATE TABLE IF NOT EXISTS product_costs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cost_column_id UUID NOT NULL REFERENCES product_cost_columns(id) ON DELETE CASCADE,
  value          DECIMAL(14, 2) NOT NULL DEFAULT 0,
  UNIQUE(product_id, cost_column_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_business ON product_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_product_cost_columns_category ON product_cost_columns(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_column ON product_costs(cost_column_id);
