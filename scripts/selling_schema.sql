-- Customizable selling cost columns per product category
CREATE TABLE IF NOT EXISTS selling_cost_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_selling_cost_columns_category ON selling_cost_columns(category_id);

-- Margin % per product (one row per product)
CREATE TABLE IF NOT EXISTS product_selling_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  margin_percent DECIMAL(8, 4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_selling_config_product ON product_selling_config(product_id);

-- Selling cost values per product per column
CREATE TABLE IF NOT EXISTS selling_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  selling_cost_column_id UUID NOT NULL REFERENCES selling_cost_columns(id) ON DELETE CASCADE,
  value DECIMAL(14, 2) NOT NULL DEFAULT 0,
  UNIQUE(product_id, selling_cost_column_id)
);

CREATE INDEX IF NOT EXISTS idx_selling_costs_product ON selling_costs(product_id);
