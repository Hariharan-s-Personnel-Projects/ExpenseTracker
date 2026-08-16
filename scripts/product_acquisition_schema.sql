-- Product Acquisition Schema
-- Run in Supabase SQL editor after product_catalog_schema.sql

CREATE TABLE IF NOT EXISTS product_acquisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES business_expenses(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Snapshots at time of purchase (prices can change in catalog later)
  product_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  unit_cost_snapshot DECIMAL(14, 2) NOT NULL DEFAULT 0,

  -- Purchase details
  quantity INTEGER NOT NULL DEFAULT 1,
  gst_per_unit DECIMAL(14, 2) NOT NULL DEFAULT 0,

  -- Derived (stored for fast reads)
  unit_acquisition_price DECIMAL(14, 2) NOT NULL,   -- unit_cost + gst_per_unit
  total_acquisition_price DECIMAL(14, 2) NOT NULL,  -- unit_acquisition_price × quantity

  purchased_by UUID REFERENCES users(id),
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_acquisitions_business_id ON product_acquisitions(business_id);
CREATE INDEX IF NOT EXISTS idx_product_acquisitions_product_id  ON product_acquisitions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_acquisitions_purchased_at ON product_acquisitions(purchased_at);
