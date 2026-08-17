-- Inventory: tracks current stock quantity per product
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_business ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Seed inventory from existing product_acquisitions (sum quantities per product)
INSERT INTO inventory (business_id, product_id, quantity, updated_at)
SELECT
  pa.business_id,
  pa.product_id,
  SUM(pa.quantity)::INTEGER AS quantity,
  MAX(pa.purchased_at) AS updated_at
FROM product_acquisitions pa
WHERE pa.product_id IS NOT NULL
GROUP BY pa.business_id, pa.product_id
ON CONFLICT (business_id, product_id)
DO UPDATE SET
  quantity = inventory.quantity + EXCLUDED.quantity,
  updated_at = GREATEST(inventory.updated_at, EXCLUDED.updated_at);
