-- Migration: add customer_segments + segment_id to selling tables
-- Safe to run even if selling_cost_columns / product_selling_config already exist

-- 1. Drop old selling tables (cascade removes selling_costs too via FK)
DROP TABLE IF EXISTS selling_costs CASCADE;
DROP TABLE IF EXISTS product_selling_config CASCADE;
DROP TABLE IF EXISTS selling_cost_columns CASCADE;

-- 2. Create customer_segments
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('B2B', 'B2C', 'Other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_business ON customer_segments(business_id);

-- 3. Recreate selling_cost_columns with segment_id
CREATE TABLE selling_cost_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, segment_id, name)
);

CREATE INDEX IF NOT EXISTS idx_selling_cost_columns_category_segment ON selling_cost_columns(category_id, segment_id);

-- 4. Recreate product_selling_config with segment_id
CREATE TABLE product_selling_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
  margin_percent DECIMAL(8, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_product_selling_config_product_segment ON product_selling_config(product_id, segment_id);

-- 5. Recreate selling_costs (no segment_id — implied via selling_cost_column_id FK)
CREATE TABLE selling_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selling_cost_column_id UUID NOT NULL REFERENCES selling_cost_columns(id) ON DELETE CASCADE,
  value DECIMAL(14, 2) NOT NULL DEFAULT 0,
  UNIQUE(product_id, selling_cost_column_id)
);

CREATE INDEX IF NOT EXISTS idx_selling_costs_product ON selling_costs(product_id);
