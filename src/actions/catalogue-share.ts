"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getBusinessSession } from "@/lib/auth/business-session";
import { canManage } from "@/lib/auth/guards";
import { randomBytes } from "crypto";
import type { ProductImage } from "@/actions/product-catalog";
import type { SalesProduct } from "@/actions/sales";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogueShareLink {
  id: string;
  token: string;
  label: string;
  segment_id: string | null;
  segment_name: string;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

export interface PublicContactInfo {
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
}

export interface PublicCatalogueData {
  businessName: string;
  industry: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  contact: PublicContactInfo;
  segmentName: string;
  products: SalesProduct[];
}

export type PublicCatalogueError =
  | { error: "not_found" }
  | { error: "inactive" }
  | { error: "expired" }
  | { error: "segment_deleted" }
  | { error: "unknown" };

// ─── Management actions (authenticated) ───────────────────────────────────────

export async function createCatalogueLink(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const label = (formData.get("label") as string)?.trim();
  const segmentId = (formData.get("segmentId") as string)?.trim();
  const segmentName = (formData.get("segmentName") as string)?.trim();
  const expiresAt = (formData.get("expiresAt") as string)?.trim() || null;

  if (!label) return { error: "Link label is required" };
  if (!segmentId || !segmentName) return { error: "Customer segment is required" };

  const token = randomBytes(20).toString("hex");

  const supabase = await createClient();
  const { error } = await supabase.from("catalogue_share_links").insert({
    business_id: session.businessId,
    token,
    label,
    segment_id: segmentId,
    segment_name: segmentName,
    is_active: true,
    expires_at: expiresAt || null,
    created_by: session.userId,
  });

  if (error) return { error: error.message };
  return { success: true, token };
}

export async function getCatalogueLinks(): Promise<CatalogueShareLink[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("catalogue_share_links")
    .select("id, token, label, segment_id, segment_name, is_active, expires_at, view_count, created_at")
    .eq("business_id", session.businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as CatalogueShareLink[];
}

export async function updateCatalogueExpiry(id: string, expiresAt: string | null) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_share_links")
    .update({ expires_at: expiresAt })
    .eq("id", id)
    .eq("business_id", session.businessId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  return { success: true };
}

export async function toggleCatalogueLink(id: string, active: boolean) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_share_links")
    .update({ is_active: active })
    .eq("id", id)
    .eq("business_id", session.businessId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCatalogueLink(id: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("catalogue_share_links")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Public data fetch (no auth, uses service role) ───────────────────────────

export async function getPublicCatalogueData(
  token: string
): Promise<PublicCatalogueData | PublicCatalogueError> {
  const db = createServiceClient();

  const { data: link } = await db
    .from("catalogue_share_links")
    .select("business_id, segment_id, segment_name, is_active, expires_at")
    .eq("token", token)
    .is("deleted_at", null)
    .single();

  if (!link) return { error: "not_found" };
  if (!link.is_active) return { error: "inactive" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { error: "expired" };
  if (!link.segment_id) return { error: "segment_deleted" };

  const businessId = link.business_id as string;
  const segmentId = link.segment_id as string;
  const segmentName = link.segment_name as string;

  // Increment view count (best-effort, non-blocking)
  db.rpc("increment_catalogue_view_count", { link_token: token }).then(() => {});

  // Fetch business + categories + products concurrently
  const [{ data: business }, { data: categories }] = await Promise.all([
    db
      .from("businesses")
      .select(
        "name, industry, logo_url, brand_color, contact_phone, contact_email, website, address_line1, address_line2, city, state, country, postal_code"
      )
      .eq("id", businessId)
      .is("deleted_at", null)
      .single(),
    db
      .from("product_categories")
      .select("id, name")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true }),
  ]);

  if (!business) return { error: "not_found" };

  const contact: PublicContactInfo = {
    phone: business.contact_phone ?? null,
    email: business.contact_email ?? null,
    website: business.website ?? null,
    address_line1: business.address_line1 ?? null,
    address_line2: business.address_line2 ?? null,
    city: business.city ?? null,
    state: business.state ?? null,
    country: business.country ?? null,
    postal_code: business.postal_code ?? null,
  };

  if (!categories || categories.length === 0) {
    return {
      businessName: business.name as string,
      industry: business.industry ?? null,
      logoUrl: business.logo_url ?? null,
      brandColor: (business as { brand_color?: string | null }).brand_color ?? null,
      contact,
      segmentName,
      products: [],
    };
  }

  const categoryIds = categories.map((c) => c.id);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const { data: rawProducts } = await db
    .from("products")
    .select(
      "id, name, description, category_id, product_costs(value), product_images(id, url, storage_path, order_index)"
    )
    .eq("business_id", businessId)
    .in("category_id", categoryIds)
    .order("created_at", { ascending: true });

  if (!rawProducts || rawProducts.length === 0) {
    return {
      businessName: business.name as string,
      industry: business.industry ?? null,
      logoUrl: business.logo_url ?? null,
      brandColor: (business as { brand_color?: string | null }).brand_color ?? null,
      contact,
      segmentName,
      products: [],
    };
  }

  const productIds = rawProducts.map((p) => p.id);

  const [
    { data: sellingCols },
    { data: sellingCostValues },
    { data: marginConfigs },
    { data: invRows },
  ] = await Promise.all([
    db
      .from("selling_cost_columns")
      .select("id")
      .eq("business_id", businessId)
      .eq("segment_id", segmentId),
    db
      .from("selling_costs")
      .select("product_id, selling_cost_column_id, value")
      .eq("business_id", businessId)
      .in("product_id", productIds),
    db
      .from("product_selling_config")
      .select("product_id, margin_percent")
      .eq("business_id", businessId)
      .eq("segment_id", segmentId)
      .in("product_id", productIds),
    db
      .from("inventory")
      .select("product_id, quantity")
      .eq("business_id", businessId)
      .in("product_id", productIds),
  ]);

  const colSet = new Set((sellingCols ?? []).map((c) => c.id));
  const sellingCostMap = new Map<string, number>();
  for (const sc of sellingCostValues ?? []) {
    if (!colSet.has(sc.selling_cost_column_id)) continue;
    sellingCostMap.set(sc.product_id, (sellingCostMap.get(sc.product_id) ?? 0) + Number(sc.value ?? 0));
  }
  const marginMap = new Map(
    (marginConfigs ?? []).map((m) => [m.product_id, Number(m.margin_percent ?? 0)])
  );
  const stockMap = new Map((invRows ?? []).map((r) => [r.product_id, r.quantity]));

  const products: SalesProduct[] = rawProducts.map((p) => {
    const costPrice = ((p.product_costs as { value: number }[]) ?? []).reduce(
      (s, c) => s + Number(c.value ?? 0),
      0
    );
    const sellingCostTotal = sellingCostMap.get(p.id) ?? 0;
    const totalCost = costPrice + sellingCostTotal;
    const margin = marginMap.get(p.id) ?? 0;
    const sellingPrice = totalCost * (1 + margin / 100);

    const rawImages = ((p.product_images as ProductImage[] | null) ?? []);
    const images = [...rawImages].sort((a, b) => a.order_index - b.order_index);

    return {
      id: p.id,
      name: p.name,
      description: (p as { description?: string | null }).description ?? "",
      categoryId: p.category_id,
      categoryName: categoryMap.get(p.category_id) ?? "",
      currentStock: stockMap.get(p.id) ?? 0,
      costPrice,
      sellingPrice,
      images,
    };
  });

  return {
    businessName: business.name as string,
    industry: business.industry ?? null,
    logoUrl: business.logo_url ?? null,
    brandColor: (business as { brand_color?: string | null }).brand_color ?? null,
    contact,
    segmentName,
    products,
  };
}
