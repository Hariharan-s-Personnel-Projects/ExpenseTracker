"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { revalidatePath } from "next/cache";

export interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  updated_at: string | null;
}

export interface InventoryCategory {
  id: string;
  name: string;
  products: InventoryProduct[];
}

export async function getInventory(): Promise<InventoryCategory[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  if (!categories || categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, category_id")
    .eq("business_id", session.businessId)
    .in("category_id", categoryIds)
    .order("created_at", { ascending: true });

  if (!products || products.length === 0) {
    return categories.map((c) => ({ id: c.id, name: c.name, products: [] }));
  }

  const productIds = products.map((p) => p.id);

  const { data: invRows } = await supabase
    .from("inventory")
    .select("product_id, quantity, updated_at")
    .eq("business_id", session.businessId)
    .in("product_id", productIds);

  const invMap = new Map<string, { quantity: number; updated_at: string }>();
  for (const row of invRows ?? []) {
    invMap.set(row.product_id, { quantity: row.quantity, updated_at: row.updated_at });
  }

  const groups: InventoryCategory[] = [];
  for (const cat of categories) {
    const catProducts: InventoryProduct[] = products
      .filter((p) => p.category_id === cat.id)
      .map((p) => {
        const inv = invMap.get(p.id);
        return {
          id: p.id,
          name: p.name,
          quantity: inv?.quantity ?? 0,
          updated_at: inv?.updated_at ?? null,
        };
      });
    groups.push({ id: cat.id, name: cat.name, products: catProducts });
  }

  return groups;
}

export async function setInventoryQuantity(productId: string, quantity: number) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  if (quantity < 0) return { error: "Quantity cannot be negative" };

  const supabase = await createClient();

  const { error } = await supabase.from("inventory").upsert(
    {
      business_id: session.businessId,
      product_id: productId,
      quantity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,product_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/business/inventory");
  return { success: true };
}

// Called internally by recordProductAcquisition to increment stock
export async function incrementInventory(
  businessId: string,
  productId: string,
  qty: number
) {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .single();

  const newQty = (current?.quantity ?? 0) + qty;

  await supabase.from("inventory").upsert(
    {
      business_id: businessId,
      product_id: productId,
      quantity: newQty,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id,product_id" }
  );
}
