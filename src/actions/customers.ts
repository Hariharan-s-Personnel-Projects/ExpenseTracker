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
