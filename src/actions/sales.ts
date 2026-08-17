"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { revalidatePath } from "next/cache";

export interface SalesProduct {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number; // computed from product margins config
}

export interface SaleRecord {
  id: string;
  segment_name: string;
  product_name: string;
  category_name: string;
  quantity: number;
  selling_price_per_unit: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
}

// ─── Get products with selling price for a segment ────────────────────────────

export async function getSalesProducts(segmentId: string): Promise<SalesProduct[]> {
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
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, category_id, product_costs(value)")
    .eq("business_id", session.businessId)
    .in("category_id", categoryIds)
    .order("created_at", { ascending: true });

  if (!rawProducts || rawProducts.length === 0) return [];
  const productIds = rawProducts.map((p) => p.id);

  const [
    { data: sellingCols },
    { data: sellingCostValues },
    { data: marginConfigs },
    { data: invRows },
  ] = await Promise.all([
    supabase
      .from("selling_cost_columns")
      .select("id, category_id")
      .eq("business_id", session.businessId)
      .eq("segment_id", segmentId),

    supabase
      .from("selling_costs")
      .select("product_id, selling_cost_column_id, value")
      .eq("business_id", session.businessId)
      .in("product_id", productIds),

    supabase
      .from("product_selling_config")
      .select("product_id, margin_percent")
      .eq("business_id", session.businessId)
      .eq("segment_id", segmentId)
      .in("product_id", productIds),

    supabase
      .from("inventory")
      .select("product_id, quantity")
      .eq("business_id", session.businessId)
      .in("product_id", productIds),
  ]);

  // Index maps
  const colSet = new Set((sellingCols ?? []).map((c) => c.id));
  const sellingCostMap = new Map<string, number>();
  for (const sc of sellingCostValues ?? []) {
    if (!colSet.has(sc.selling_cost_column_id)) continue;
    const key = sc.product_id;
    sellingCostMap.set(key, (sellingCostMap.get(key) ?? 0) + Number(sc.value ?? 0));
  }
  const marginMap = new Map((marginConfigs ?? []).map((m) => [m.product_id, Number(m.margin_percent ?? 0)]));
  const stockMap = new Map((invRows ?? []).map((r) => [r.product_id, r.quantity]));

  return rawProducts.map((p) => {
    const costPrice = ((p.product_costs as { value: number }[]) ?? [])
      .reduce((s, c) => s + Number(c.value ?? 0), 0);
    const sellingCostTotal = sellingCostMap.get(p.id) ?? 0;
    const totalCost = costPrice + sellingCostTotal;
    const margin = marginMap.get(p.id) ?? 0;
    const sellingPrice = totalCost * (1 + margin / 100);

    return {
      id: p.id,
      name: p.name,
      categoryId: p.category_id,
      categoryName: categoryMap.get(p.category_id) ?? "",
      currentStock: stockMap.get(p.id) ?? 0,
      costPrice,
      sellingPrice,
    };
  });
}

// ─── Record a batch of sales ──────────────────────────────────────────────────

export async function recordSales(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const segmentId = formData.get("segmentId") as string;
  const segmentName = formData.get("segmentName") as string;
  const itemsJson = formData.get("items") as string;
  const saleDate = (formData.get("saleDate") as string) || new Date().toISOString().split("T")[0];
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!segmentId || !itemsJson) return { error: "Missing required fields" };

  interface SaleItem {
    productId: string;
    productName: string;
    categoryName: string;
    quantity: number;
    sellingPrice: number;
  }

  let items: SaleItem[];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return { error: "Invalid items data" };
  }

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) return { error: "Enter quantity for at least one product" };

  const supabase = await createClient();

  // Insert sale records
  const { error: saleError } = await supabase.from("sales").insert(
    validItems.map((item) => ({
      business_id: session.businessId,
      segment_id: segmentId,
      product_id: item.productId,
      segment_name: segmentName,
      product_name: item.productName,
      category_name: item.categoryName,
      quantity: item.quantity,
      selling_price_per_unit: item.sellingPrice,
      total_amount: item.sellingPrice * item.quantity,
      sale_date: saleDate,
      recorded_by: session.userId,
      notes,
    }))
  );

  if (saleError) return { error: saleError.message };

  // Decrease inventory for each product sold
  for (const item of validItems) {
    const { data: current } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("business_id", session.businessId)
      .eq("product_id", item.productId)
      .single();

    const newQty = Math.max(0, (current?.quantity ?? 0) - item.quantity);
    await supabase.from("inventory").upsert(
      { business_id: session.businessId, product_id: item.productId, quantity: newQty, updated_at: new Date().toISOString() },
      { onConflict: "business_id,product_id" }
    );
  }

  revalidatePath("/business/sales");
  revalidatePath("/business/inventory");
  return { success: true, count: validItems.length };
}

// ─── Update a sale record ─────────────────────────────────────────────────────

export async function updateSale(
  id: string,
  quantity: number,
  soldPrice: number
): Promise<{ error?: string; success?: boolean }> {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("product_id, quantity")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!sale) return { error: "Sale not found" };

  // Adjust inventory by the quantity difference
  const qtyDiff = sale.quantity - quantity;
  const { data: invRow } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("business_id", session.businessId)
    .eq("product_id", sale.product_id)
    .single();

  const newInv = Math.max(0, (invRow?.quantity ?? 0) + qtyDiff);
  await supabase.from("inventory").upsert(
    { business_id: session.businessId, product_id: sale.product_id, quantity: newInv, updated_at: new Date().toISOString() },
    { onConflict: "business_id,product_id" }
  );

  const { error } = await supabase
    .from("sales")
    .update({ quantity, selling_price_per_unit: soldPrice, total_amount: soldPrice * quantity })
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/finance/sales");
  revalidatePath("/business/sales");
  revalidatePath("/business/inventory");
  return { success: true };
}

// ─── Delete a sale record ─────────────────────────────────────────────────────

export async function deleteSale(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: sale } = await supabase
    .from("sales")
    .select("product_id, quantity")
    .eq("id", id)
    .eq("business_id", session.businessId)
    .single();

  if (!sale) return { error: "Sale not found" };

  // Restore inventory
  const { data: invRow } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("business_id", session.businessId)
    .eq("product_id", sale.product_id)
    .single();

  await supabase.from("inventory").upsert(
    { business_id: session.businessId, product_id: sale.product_id, quantity: (invRow?.quantity ?? 0) + sale.quantity, updated_at: new Date().toISOString() },
    { onConflict: "business_id,product_id" }
  );

  const { error } = await supabase
    .from("sales")
    .delete()
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/finance/sales");
  revalidatePath("/business/sales");
  revalidatePath("/business/inventory");
  return { success: true };
}

// ─── Sales history ────────────────────────────────────────────────────────────

export async function getRecentSales(limit = 50): Promise<SaleRecord[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("id, segment_name, product_name, category_name, quantity, selling_price_per_unit, total_amount, sale_date, created_at")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => ({
    id: r.id,
    segment_name: r.segment_name,
    product_name: r.product_name,
    category_name: r.category_name,
    quantity: r.quantity,
    selling_price_per_unit: Number(r.selling_price_per_unit),
    total_amount: Number(r.total_amount),
    sale_date: r.sale_date,
    created_at: r.created_at,
  }));
}
