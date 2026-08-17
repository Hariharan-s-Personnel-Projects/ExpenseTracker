import { requireRetailSession } from "@/lib/auth/guards";
import { getProductCategories } from "@/actions/product-catalog";
import CatalogClient from "./client";

export default async function CatalogPage() {
  const session = await requireRetailSession();

  const categories = await getProductCategories();

  return <CatalogClient categories={categories} role={session.role} />;
}
