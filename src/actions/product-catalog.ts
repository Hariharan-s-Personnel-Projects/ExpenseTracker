"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getBusinessSession } from "@/lib/auth/business-session";
import { canWrite } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { incrementInventory } from "@/actions/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CostColumn {
  id: string;
  name: string;
  order_index: number;
}

export interface ProductImage {
  id: string;
  url: string;
  storage_path: string;
  order_index: number;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  created_at: string;
  costs: Record<string, number>; // cost_column_id → value
  totalCost: number;
  images: ProductImage[];
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
  columnCount: number;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getProductCategories(): Promise<ProductCategory[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("product_categories")
    .select(`
      id, name, description,
      products(id),
      product_cost_columns(id)
    `)
    .eq("business_id", session.businessId)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    productCount: Array.isArray(c.products) ? c.products.length : 0,
    columnCount: Array.isArray(c.product_cost_columns)
      ? c.product_cost_columns.length
      : 0,
  }));
}

export async function getCatalogBusinessInfo(): Promise<{
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
} | null> {
  const session = await getBusinessSession();
  if (!session) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("businesses")
    .select("name, logo_url, brand_color")
    .eq("id", session.businessId)
    .single();

  if (!data) return null;
  return {
    name: data.name as string,
    logoUrl: (data.logo_url as string | null) ?? null,
    brandColor: (data.brand_color as string | null) ?? null,
  };
}

export async function createProductCategory(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Category name is required" };

  const supabase = await createClient();

  const { error } = await supabase.from("product_categories").insert({
    business_id: session.businessId,
    name,
    description,
    created_by: session.userId,
  });

  if (error) {
    if (error.code === "23505")
      return { error: "A category with this name already exists" };
    return { error: error.message };
  }

  revalidatePath("/business/catalog");
  return { success: true };
}

export async function updateProductCategory(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Category name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_categories")
    .update({ name, description })
    .eq("id", id)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/catalog");
  return { success: true };
}

export async function deleteProductCategory(categoryId: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", categoryId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/catalog");
  return { success: true };
}

// ─── Category Detail (columns + products) ────────────────────────────────────

export async function getCategoryDetails(categoryId: string) {
  const session = await getBusinessSession();
  if (!session) return null;

  const supabase = await createClient();

  const [{ data: category }, { data: columns }, { data: rawProducts }] =
    await Promise.all([
      supabase
        .from("product_categories")
        .select("id, name, description")
        .eq("id", categoryId)
        .eq("business_id", session.businessId)
        .single(),

      supabase
        .from("product_cost_columns")
        .select("id, name, order_index")
        .eq("category_id", categoryId)
        .eq("business_id", session.businessId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true }),

      supabase
        .from("products")
        .select(`id, name, description, created_at, product_costs(cost_column_id, value), product_images(id, url, storage_path, order_index)`)
        .eq("category_id", categoryId)
        .eq("business_id", session.businessId)
        .order("created_at", { ascending: true }),
    ]);

  if (!category) return null;

  const products: ProductRow[] = (rawProducts ?? []).map((p) => {
    const costArr = (
      p.product_costs as { cost_column_id: string; value: number }[]
    ) ?? [];
    const costs: Record<string, number> = {};
    let totalCost = 0;
    for (const c of costArr) {
      const v = Number(c.value ?? 0);
      costs[c.cost_column_id] = v;
      totalCost += v;
    }
    const rawImages = (p.product_images as { id: string; url: string; storage_path: string; order_index: number }[] | null) ?? [];
    const images = [...rawImages].sort((a, b) => a.order_index - b.order_index);
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      created_at: p.created_at,
      costs,
      totalCost,
      images,
    };
  });

  return {
    category,
    costColumns: (columns ?? []) as CostColumn[],
    products,
    role: session.role,
    businessId: session.businessId,
  };
}

// ─── Cost Columns ─────────────────────────────────────────────────────────────

export async function addCostColumn(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Column name is required" };

  const supabase = await createClient();

  // Get max order_index
  const { data: existing } = await supabase
    .from("product_cost_columns")
    .select("order_index")
    .eq("category_id", categoryId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing?.[0]?.order_index != null
    ? existing[0].order_index + 1
    : 0;

  const { data: newCol, error } = await supabase
    .from("product_cost_columns")
    .insert({
      business_id: session.businessId,
      category_id: categoryId,
      name,
      order_index: nextIndex,
    })
    .select("id")
    .single();

  if (error || !newCol) return { error: error?.message ?? "Failed to add column" };

  // Backfill cost rows for all existing products (value = 0)
  const { data: existingProducts } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId);

  if (existingProducts && existingProducts.length > 0) {
    await supabase.from("product_costs").insert(
      existingProducts.map((p) => ({
        product_id: p.id,
        cost_column_id: newCol.id,
        value: 0,
      }))
    );
  }

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

export async function renameCostColumn(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const columnId = formData.get("columnId") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Column name is required" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_cost_columns")
    .update({ name })
    .eq("id", columnId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

export async function deleteCostColumn(columnId: string, categoryId: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_cost_columns")
    .delete()
    .eq("id", columnId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

export async function reorderCostColumns(
  orderedIds: string[],
  categoryId: string
) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("product_cost_columns")
        .update({ order_index: index })
        .eq("id", id)
        .eq("business_id", session.businessId)
    )
  );

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function addProduct(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Product name is required" };

  const supabase = await createClient();

  // Get all cost columns for this category
  const { data: columns } = await supabase
    .from("product_cost_columns")
    .select("id")
    .eq("category_id", categoryId);

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      business_id: session.businessId,
      category_id: categoryId,
      name,
      description,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (productError || !product)
    return { error: productError?.message ?? "Failed to add product" };

  // Insert cost values for every column
  if (columns && columns.length > 0) {
    const costEntries = columns.map((col) => ({
      product_id: product.id,
      cost_column_id: col.id,
      value:
        parseFloat((formData.get(`cost_${col.id}`) as string) ?? "0") || 0,
    }));
    await supabase.from("product_costs").insert(costEntries);
  }

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const productId = formData.get("productId") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Product name is required" };

  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("products")
    .update({ name, description })
    .eq("id", productId)
    .eq("business_id", session.businessId);

  if (updateError) return { error: updateError.message };

  // Get all cost columns for this category
  const { data: columns } = await supabase
    .from("product_cost_columns")
    .select("id")
    .eq("category_id", categoryId);

  if (columns && columns.length > 0) {
    const upserts = columns.map((col) => ({
      product_id: productId,
      cost_column_id: col.id,
      value:
        parseFloat((formData.get(`cost_${col.id}`) as string) ?? "0") || 0,
    }));
    await supabase
      .from("product_costs")
      .upsert(upserts, { onConflict: "product_id,cost_column_id" });
  }

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

export async function deleteProduct(productId: string, categoryId: string) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

// ─── Product Images ───────────────────────────────────────────────────────────

export async function addProductImage(
  productId: string,
  imageUrl: string,
  storagePath: string,
  categoryId: string
): Promise<{ error: string } | { success: true; image: ProductImage }> {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("business_id", session.businessId);

  if ((count ?? 0) >= 10) return { error: "Maximum 10 images per product" };

  const { data: existing } = await supabase
    .from("product_images")
    .select("order_index")
    .eq("product_id", productId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing?.[0]?.order_index != null ? existing[0].order_index + 1 : 0;

  const { data: image, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      business_id: session.businessId,
      url: imageUrl,
      storage_path: storagePath,
      order_index: nextIndex,
    })
    .select("id, url, storage_path, order_index")
    .single();

  if (error || !image) return { error: error?.message ?? "Failed to add image" };

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true, image: image as ProductImage };
}

export async function deleteProductImage(
  imageId: string,
  categoryId: string
): Promise<{ error: string } | { success: true }> {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath(`/business/catalog/${categoryId}`);
  return { success: true };
}

// ─── Product Acquisitions ─────────────────────────────────────────────────────

export interface AcquisitionLog {
  id: string;
  product_name: string;
  unit_cost_snapshot: number;
  quantity: number;
  gst_per_unit: number;
  unit_acquisition_price: number;
  total_acquisition_price: number;
  purchased_at: string;
}

export async function recordProductAcquisition(formData: FormData) {
  const session = await getBusinessSession();
  if (!session) return { error: "Not authenticated" };
  if (!canWrite(session.role)) return { error: "Permission denied" };

  const productId = formData.get("productId") as string;
  const categoryId = formData.get("categoryId") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const gstPerUnit = parseFloat(formData.get("gstPerUnit") as string) || 0;
  const unitCostSnapshot = parseFloat(formData.get("unitCostSnapshot") as string) || 0;

  if (quantity < 1) return { error: "Quantity must be at least 1" };

  const supabase = await createClient();

  // Fetch product + category name
  const { data: product } = await supabase
    .from("products")
    .select("name, product_categories(name)")
    .eq("id", productId)
    .eq("business_id", session.businessId)
    .single();

  if (!product) return { error: "Product not found" };

  const productName = product.name;
  const categoryName =
    (product.product_categories as unknown as { name: string } | null)?.name ?? "";
  const unitAcquisitionPrice = unitCostSnapshot + gstPerUnit;
  const totalAcquisitionPrice = unitAcquisitionPrice * quantity;
  const today = new Date().toISOString().split("T")[0];

  // Ensure "Product Acquisition" category exists in business_categories
  await supabase.from("business_categories").upsert(
    { business_id: session.businessId, name: "Product Acquisition" },
    { onConflict: "business_id,name", ignoreDuplicates: true }
  );

  // Create the business expense
  const { data: expense, error: expenseError } = await supabase
    .from("business_expenses")
    .insert({
      business_id: session.businessId,
      submitted_by: session.userId,
      amount: totalAcquisitionPrice,
      category: "Product Acquisition",
      description: `Purchase: ${productName} × ${quantity}`,
      expense_date: today,
      status: "pending",
    })
    .select("id")
    .single();

  if (expenseError || !expense)
    return { error: expenseError?.message ?? "Failed to create expense" };

  // Log the acquisition with price snapshot
  const { error: logError } = await supabase
    .from("product_acquisitions")
    .insert({
      business_id: session.businessId,
      expense_id: expense.id,
      product_id: productId,
      product_name: productName,
      category_name: categoryName,
      unit_cost_snapshot: unitCostSnapshot,
      quantity,
      gst_per_unit: gstPerUnit,
      unit_acquisition_price: unitAcquisitionPrice,
      total_acquisition_price: totalAcquisitionPrice,
      purchased_by: session.userId,
    });

  if (logError) return { error: logError.message };

  // Update inventory stock level
  await incrementInventory(session.businessId, productId, quantity);

  revalidatePath(`/business/catalog/${categoryId}`);
  revalidatePath("/business/expenses");
  revalidatePath("/business/inventory");
  return { success: true };
}

export async function getAcquisitionLogs(
  categoryId: string
): Promise<AcquisitionLog[]> {
  const session = await getBusinessSession();
  if (!session) return [];

  const supabase = await createClient();

  const { data: productIds } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", categoryId)
    .eq("business_id", session.businessId);

  if (!productIds || productIds.length === 0) return [];

  const { data } = await supabase
    .from("product_acquisitions")
    .select(
      "id, product_name, unit_cost_snapshot, quantity, gst_per_unit, unit_acquisition_price, total_acquisition_price, purchased_at"
    )
    .eq("business_id", session.businessId)
    .in("product_id", productIds.map((p) => p.id))
    .order("purchased_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((r) => ({
    id: r.id,
    product_name: r.product_name,
    unit_cost_snapshot: Number(r.unit_cost_snapshot),
    quantity: r.quantity,
    gst_per_unit: Number(r.gst_per_unit),
    unit_acquisition_price: Number(r.unit_acquisition_price),
    total_acquisition_price: Number(r.total_acquisition_price),
    purchased_at: r.purchased_at,
  }));
}
