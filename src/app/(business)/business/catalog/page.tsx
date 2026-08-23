import { requireRetailSession } from "@/lib/auth/guards";
import { getProductCategories, getCatalogBusinessInfo } from "@/actions/product-catalog";
import CatalogClient from "./client";

export default async function CatalogPage() {
  const session = await requireRetailSession();

  const [categories, businessInfo] = await Promise.all([
    getProductCategories(),
    getCatalogBusinessInfo(),
  ]);

  return (
    <CatalogClient
      categories={categories}
      role={session.role}
      businessName={businessInfo?.name ?? null}
      logoUrl={businessInfo?.logoUrl ?? null}
      brandColor={businessInfo?.brandColor ?? null}
    />
  );
}
