import { requireRetailSession } from "@/lib/auth/guards";
import { getProductCategories } from "@/actions/product-catalog";
import { getBusinessInfo } from "@/actions/business-auth";
import CatalogClient from "./client";

export default async function CatalogPage() {
  const session = await requireRetailSession();

  const [categories, businessInfo] = await Promise.all([
    getProductCategories(),
    getBusinessInfo(),
  ]);

  return (
    <CatalogClient
      categories={categories}
      role={session.role}
      businessName={businessInfo?.name ?? null}
      logoUrl={businessInfo?.logo_url ?? null}
    />
  );
}
