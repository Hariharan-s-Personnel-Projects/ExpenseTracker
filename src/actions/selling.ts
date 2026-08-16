"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellingCostColumn {
  id: string;
  name: string;
  order_index: number;
}

export interface SellingProductRow {
  id: string;
  name: string;
  costPrice: number; // catalog totalCost — read-only
  sellingCosts: Record<string, number>; // selling_cost_column_id → value
  marginPercent: number;
}

export interface SellingCategoryGroup {
  id: string;
  name: string;
  costColumns: SellingCostColumn[];
  products: SellingProductRow[];
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getSellingData(): Promise<SellingCategoryGroup[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();

  // All product categories for this business
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  if (!categories || categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);

  // All products with their catalog costs
  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, category_id, product_costs(value)")
    .eq("business_id", session.businessId)
    .in("category_id", categoryIds)
    .order("created_at", { ascending: true });

  // Selling cost columns per category
  const { data: sellingCols } = await supabase
    .from("selling_cost_columns")
    .select("id, name, order_index, category_id")
    .eq("business_id", session.businessId)
    .in("category_id", categoryIds)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  const productIds = (rawProducts ?? []).map((p) => p.id);

  // Selling cost values
  const { data: sellingCostValues } = productIds.length > 0
    ? await supabase
        .from("selling_costs")
        .select("product_id, selling_cost_column_id, value")
        .eq("business_id", session.businessId)
        .in("product_id", productIds)
    : { data: [] };

  // Margin configs
  const { data: marginConfigs } = productIds.length > 0
    ? await supabase
        .from("product_selling_config")
        .select("product_id, margin_percent")
        .eq("business_id", session.businessId)
        .in("product_id", productIds)
    : { data: [] };

  // Index lookups
  const colsByCategory = new Map<string, SellingCostColumn[]>();
  for (const col of sellingCols ?? []) {
    const arr = colsByCategory.get(col.category_id) ?? [];
    arr.push({ id: col.id, name: col.name, order_index: col.order_index });
    colsByCategory.set(col.category_id, arr);
  }

  const sellingCostMap = new Map<string, Record<string, number>>();
  for (const sc of sellingCostValues ?? []) {
    const record = sellingCostMap.get(sc.product_id) ?? {};
    record[sc.selling_cost_column_id] = Number(sc.value ?? 0);
    sellingCostMap.set(sc.product_id, record);
  }

  const marginMap = new Map<string, number>();
  for (const m of marginConfigs ?? []) {
    marginMap.set(m.product_id, Number(m.margin_percent ?? 0));
  }

  // Build groups
  const groups: SellingCategoryGroup[] = [];
  for (const cat of categories) {
    const costColumns = colsByCategory.get(cat.id) ?? [];
    const products: SellingProductRow[] = (rawProducts ?? [])
      .filter((p) => p.category_id === cat.id)
      .map((p) => {
        const costs = (p.product_costs as { value: number }[]) ?? [];
        const costPrice = costs.reduce((s, c) => s + Number(c.value ?? 0), 0);
        return {
          id: p.id,
          name: p.name,
          costPrice,
          sellingCosts: sellingCostMap.get(p.id) ?? {},
          marginPercent: marginMap.get(p.id) ?? 0,
        };
      });

    groups.push({ id: cat.id, name: cat.name, costColumns, products });
  }

  return groups;
}

// ─── Upsert product margin + selling costs ────────────────────────────────────

export async function upsertProductSellingConfig(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const productId = formData.get("productId") as string;
  const marginPercent = parseFloat(formData.get("marginPercent") as string) || 0;
  const columnIds = (formData.get("columnIds") as string)?.split(",").filter(Boolean) ?? [];

  if (!productId) return { error: "Product ID is required" };

  const supabase = await createClient();

  // Upsert margin
  const { error: marginError } = await supabase
    .from("product_selling_config")
    .upsert(
      { business_id: session.businessId, product_id: productId, margin_percent: marginPercent, updated_at: new Date().toISOString() },
      { onConflict: "product_id" }
    );

  if (marginError) return { error: marginError.message };

  // Upsert selling cost values
  if (columnIds.length > 0) {
    const upserts = columnIds.map((colId) => ({
      business_id: session.businessId,
      product_id: productId,
      selling_cost_column_id: colId,
      value: parseFloat(formData.get(`cost_${colId}`) as string) || 0,
    }));
    const { error: costError } = await supabase
      .from("selling_costs")
      .upsert(upserts, { onConflict: "product_id,selling_cost_column_id" });
    if (costError) return { error: costError.message };
  }

  revalidatePath("/business/selling");
  return { success: true };
}

// ─── Selling cost column management ──────────────────────────────────────────

export async function addSellingCostColumn(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (session.role === "member") return { error: "Permission denied" };

  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Column name is required" };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("selling_cost_columns")
    .select("order_index")
    .eq("category_id", categoryId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing?.[0]?.order_index != null ? existing[0].order_index + 1 : 0;

  const { data: newCol, error } = await supabase
    .from("selling_cost_columns")
    .insert({ business_id: session.businessId, category_id: categoryId, name, order_index: nextIndex })
    .select("id")
    .single();

  if (error || !newCol) return { error: error?.message ?? "Failed to add column" };

  // Backfill selling_costs rows (value=0) for all products in this category
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId);

  if (products && products.length > 0) {
    await supabase.from("selling_costs").insert(
      products.map((p) => ({
        business_id: session.businessId,
        product_id: p.id,
        selling_cost_column_id: newCol.id,
        value: 0,
      }))
    );
  }

  revalidatePath("/business/selling");
  return { success: true };
}

export async function renameSellingCostColumn(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (session.role === "member") return { error: "Permission denied" };

  const columnId = formData.get("columnId") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Column name is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("selling_cost_columns")
    .update({ name })
    .eq("id", columnId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/selling");
  return { success: true };
}

export async function deleteSellingCostColumn(columnId: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (session.role === "member") return { error: "Permission denied" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("selling_cost_columns")
    .delete()
    .eq("id", columnId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/selling");
  return { success: true };
}

export async function reorderSellingCostColumns(orderedIds: string[]) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (session.role === "member") return { error: "Permission denied" };

  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("selling_cost_columns")
        .update({ order_index: index })
        .eq("id", id)
        .eq("business_id", session.businessId)
    )
  );

  revalidatePath("/business/selling");
  return { success: true };
}
