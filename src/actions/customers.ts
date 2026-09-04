"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { canWrite } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface CustomerSegment {
  id: string;
  name: string;
  type: "B2B" | "B2C" | "Other";
  created_at: string;
}

export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_segments")
    .select("id, name, type, created_at")
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  return (data ?? []) as CustomerSegment[];
}

export async function createCustomerSegment(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!name) return { error: "Segment name is required" };
  if (!["B2B", "B2C", "Other"].includes(type)) return { error: "Invalid segment type" };

  const supabase = await createClient();
  const { error } = await supabase.from("customer_segments").insert({
    business_id: session.businessId,
    name,
    type,
  });

  if (error) {
    if (error.code === "23505") return { error: "A segment with this name already exists" };
    return { error: error.message };
  }

  revalidatePath("/business/customers");
  return { success: true };
}

export async function updateCustomerSegment(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!name) return { error: "Segment name is required" };
  if (!["B2B", "B2C", "Other"].includes(type)) return { error: "Invalid segment type" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_segments")
    .update({ name, type })
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) {
    if (error.code === "23505") return { error: "A segment with this name already exists" };
    return { error: error.message };
  }

  revalidatePath("/business/customers");
  revalidatePath("/business/product-margins");
  return { success: true };
}

export async function deleteCustomerSegment(segmentId: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_segments")
    .delete()
    .eq("id", segmentId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/customers");
  revalidatePath("/business/product-margins");
  return { success: true };
}

export async function copySegmentConfig(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const sourceSegmentId = formData.get("sourceSegmentId") as string;
  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;

  if (!sourceSegmentId) return { error: "Source segment is required" };
  if (!name) return { error: "Segment name is required" };
  if (!["B2B", "B2C", "Other"].includes(type)) return { error: "Invalid segment type" };

  const supabase = await createClient();

  // Create the new segment
  const { data: newSeg, error: segError } = await supabase
    .from("customer_segments")
    .insert({ business_id: session.businessId, name, type })
    .select("id")
    .single();

  if (segError) {
    if (segError.code === "23505") return { error: "A segment with this name already exists" };
    return { error: segError.message };
  }

  const newSegmentId = newSeg.id;

  // Copy selling cost columns (segment-specific custom cost columns per category)
  const { data: sourceCols } = await supabase
    .from("selling_cost_columns")
    .select("id, name, order_index, category_id")
    .eq("business_id", session.businessId)
    .eq("segment_id", sourceSegmentId);

  const oldToNewColId = new Map<string, string>();

  if (sourceCols && sourceCols.length > 0) {
    const { data: newCols, error: colsError } = await supabase
      .from("selling_cost_columns")
      .insert(
        sourceCols.map((c) => ({
          business_id: session.businessId,
          category_id: c.category_id,
          segment_id: newSegmentId,
          name: c.name,
          order_index: c.order_index,
        }))
      )
      .select("id");

    if (colsError) return { error: colsError.message };

    // Map old column IDs to new column IDs (order is preserved from insert)
    sourceCols.forEach((oldCol, i) => {
      if (newCols?.[i]) oldToNewColId.set(oldCol.id, newCols[i].id);
    });

    // Copy selling cost values for all products
    if (oldToNewColId.size > 0) {
      const oldColIds = Array.from(oldToNewColId.keys());
      const { data: sourceCosts } = await supabase
        .from("selling_costs")
        .select("product_id, selling_cost_column_id, value")
        .eq("business_id", session.businessId)
        .in("selling_cost_column_id", oldColIds);

      if (sourceCosts && sourceCosts.length > 0) {
        const costInserts = sourceCosts
          .map((sc) => {
            const newColId = oldToNewColId.get(sc.selling_cost_column_id);
            if (!newColId) return null;
            return {
              business_id: session.businessId,
              product_id: sc.product_id,
              selling_cost_column_id: newColId,
              value: sc.value,
            };
          })
          .filter(Boolean) as { business_id: string; product_id: string; selling_cost_column_id: string; value: number }[];

        if (costInserts.length > 0) {
          const { error: costError } = await supabase.from("selling_costs").insert(costInserts);
          if (costError) return { error: costError.message };
        }
      }
    }
  }

  // Copy product margin configs
  const { data: sourceMargins } = await supabase
    .from("product_selling_config")
    .select("product_id, margin_percent")
    .eq("business_id", session.businessId)
    .eq("segment_id", sourceSegmentId);

  if (sourceMargins && sourceMargins.length > 0) {
    const { error: marginError } = await supabase.from("product_selling_config").insert(
      sourceMargins.map((m) => ({
        business_id: session.businessId,
        product_id: m.product_id,
        segment_id: newSegmentId,
        margin_percent: m.margin_percent,
        updated_at: new Date().toISOString(),
      }))
    );
    if (marginError) return { error: marginError.message };
  }

  revalidatePath("/business/customers");
  revalidatePath("/business/product-margins");
  return { success: true };
}

// ─── Shared helper ────────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function ensureTargetColumns(
  supabase: SupabaseClient,
  businessId: string,
  sourceSegmentId: string,
  targetSegmentId: string,
  categoryIds: string[]
): Promise<Map<string, string>> {
  if (categoryIds.length === 0) return new Map();

  const { data: sourceCols } = await supabase
    .from("selling_cost_columns")
    .select("id, name, order_index, category_id")
    .eq("business_id", businessId)
    .eq("segment_id", sourceSegmentId)
    .in("category_id", categoryIds);

  if (!sourceCols || sourceCols.length === 0) return new Map();

  const { data: targetCols } = await supabase
    .from("selling_cost_columns")
    .select("id, name, category_id")
    .eq("business_id", businessId)
    .eq("segment_id", targetSegmentId)
    .in("category_id", categoryIds);

  // (category_id:name) → existing target column id
  const targetLookup = new Map<string, string>();
  for (const tc of targetCols ?? []) {
    targetLookup.set(`${tc.category_id}:${tc.name}`, tc.id);
  }

  const oldToNew = new Map<string, string>();
  const toCreate: { sourceId: string; business_id: string; category_id: string; segment_id: string; name: string; order_index: number }[] = [];

  for (const sc of sourceCols) {
    const existing = targetLookup.get(`${sc.category_id}:${sc.name}`);
    if (existing) {
      oldToNew.set(sc.id, existing);
    } else {
      toCreate.push({ sourceId: sc.id, business_id: businessId, category_id: sc.category_id, segment_id: targetSegmentId, name: sc.name, order_index: sc.order_index });
    }
  }

  if (toCreate.length > 0) {
    const { data: newCols } = await supabase
      .from("selling_cost_columns")
      .insert(toCreate.map(({ sourceId: _s, ...rest }) => rest))
      .select("id");
    toCreate.forEach((c, i) => { if (newCols?.[i]) oldToNew.set(c.sourceId, newCols[i].id); });
  }

  return oldToNew;
}

// ─── Sync: copy products where target has no margin OR margin is 0 ────────────

export async function syncNewProductsToSegment(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const sourceSegmentId = formData.get("sourceSegmentId") as string;
  const targetSegmentId = formData.get("targetSegmentId") as string;

  if (!sourceSegmentId || !targetSegmentId) return { error: "Source and target segments are required" };
  if (sourceSegmentId === targetSegmentId) return { error: "Source and target must be different" };

  const supabase = await createClient();

  const { data: sourceMargins } = await supabase
    .from("product_selling_config")
    .select("product_id, margin_percent")
    .eq("business_id", session.businessId)
    .eq("segment_id", sourceSegmentId);

  if (!sourceMargins || sourceMargins.length === 0) {
    return { error: "Source segment has no configured products" };
  }

  const { data: targetMargins } = await supabase
    .from("product_selling_config")
    .select("product_id, margin_percent")
    .eq("business_id", session.businessId)
    .eq("segment_id", targetSegmentId);

  // Treat as "not configured" if: no row at all, OR margin is 0 (never properly set up)
  const targetMarginMap = new Map((targetMargins ?? []).map((m) => [m.product_id, Number(m.margin_percent ?? 0)]));
  const newProducts = sourceMargins.filter((m) => {
    const targetMargin = targetMarginMap.get(m.product_id);
    return targetMargin === undefined || targetMargin === 0;
  });

  if (newProducts.length === 0) {
    return { error: "No products to update — all products from source are already configured in target" };
  }

  const newProductIds = newProducts.map((m) => m.product_id);

  const { data: productRows } = await supabase
    .from("products")
    .select("id, category_id")
    .in("id", newProductIds);

  const categoryIds = [...new Set((productRows ?? []).map((p) => p.category_id))];

  const oldToNewColId = await ensureTargetColumns(supabase, session.businessId, sourceSegmentId, targetSegmentId, categoryIds);

  if (oldToNewColId.size > 0) {
    const { data: sourceCosts } = await supabase
      .from("selling_costs")
      .select("product_id, selling_cost_column_id, value")
      .eq("business_id", session.businessId)
      .in("product_id", newProductIds)
      .in("selling_cost_column_id", Array.from(oldToNewColId.keys()));

    if (sourceCosts && sourceCosts.length > 0) {
      const costInserts = sourceCosts
        .map((sc) => { const cid = oldToNewColId.get(sc.selling_cost_column_id); if (!cid) return null; return { business_id: session.businessId, product_id: sc.product_id, selling_cost_column_id: cid, value: sc.value }; })
        .filter(Boolean) as { business_id: string; product_id: string; selling_cost_column_id: string; value: number }[];
      if (costInserts.length > 0) {
        const { error } = await supabase.from("selling_costs").upsert(costInserts, { onConflict: "product_id,selling_cost_column_id" });
        if (error) return { error: error.message };
      }
    }
  }

  const { error: marginError } = await supabase.from("product_selling_config").upsert(
    newProducts.map((m) => ({ business_id: session.businessId, product_id: m.product_id, segment_id: targetSegmentId, margin_percent: m.margin_percent, updated_at: new Date().toISOString() })),
    { onConflict: "product_id,segment_id" }
  );
  if (marginError) return { error: marginError.message };

  revalidatePath("/business/customers");
  revalidatePath("/business/product-margins");
  return { success: true, count: newProducts.length };
}

// ─── Sync: copy ALL products from source → target (overwrite existing) ────────

export async function copyAllToSegment(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const sourceSegmentId = formData.get("sourceSegmentId") as string;
  const targetSegmentId = formData.get("targetSegmentId") as string;

  if (!sourceSegmentId || !targetSegmentId) return { error: "Source and target segments are required" };
  if (sourceSegmentId === targetSegmentId) return { error: "Source and target must be different" };

  const supabase = await createClient();

  const { data: sourceMargins } = await supabase
    .from("product_selling_config")
    .select("product_id, margin_percent")
    .eq("business_id", session.businessId)
    .eq("segment_id", sourceSegmentId);

  if (!sourceMargins || sourceMargins.length === 0) {
    return { error: "Source segment has no configured products" };
  }

  const sourceProductIds = sourceMargins.map((m) => m.product_id);

  const { data: productRows } = await supabase
    .from("products")
    .select("id, category_id")
    .in("id", sourceProductIds);

  const categoryIds = [...new Set((productRows ?? []).map((p) => p.category_id))];

  const oldToNewColId = await ensureTargetColumns(supabase, session.businessId, sourceSegmentId, targetSegmentId, categoryIds);

  if (oldToNewColId.size > 0) {
    const { data: sourceCosts } = await supabase
      .from("selling_costs")
      .select("product_id, selling_cost_column_id, value")
      .eq("business_id", session.businessId)
      .in("product_id", sourceProductIds)
      .in("selling_cost_column_id", Array.from(oldToNewColId.keys()));

    if (sourceCosts && sourceCosts.length > 0) {
      const costUpserts = sourceCosts
        .map((sc) => { const cid = oldToNewColId.get(sc.selling_cost_column_id); if (!cid) return null; return { business_id: session.businessId, product_id: sc.product_id, selling_cost_column_id: cid, value: sc.value }; })
        .filter(Boolean) as { business_id: string; product_id: string; selling_cost_column_id: string; value: number }[];
      if (costUpserts.length > 0) {
        const { error } = await supabase.from("selling_costs").upsert(costUpserts, { onConflict: "product_id,selling_cost_column_id" });
        if (error) return { error: error.message };
      }
    }
  }

  const { error: marginError } = await supabase.from("product_selling_config").upsert(
    sourceMargins.map((m) => ({ business_id: session.businessId, product_id: m.product_id, segment_id: targetSegmentId, margin_percent: m.margin_percent, updated_at: new Date().toISOString() })),
    { onConflict: "product_id,segment_id" }
  );
  if (marginError) return { error: marginError.message };

  revalidatePath("/business/customers");
  revalidatePath("/business/product-margins");
  return { success: true, count: sourceMargins.length };
}
