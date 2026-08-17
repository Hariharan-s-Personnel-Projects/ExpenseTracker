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
