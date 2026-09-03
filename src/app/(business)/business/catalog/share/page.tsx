import { requireSession } from "@/lib/auth/guards";
import { getCatalogueLinks } from "@/actions/catalogue-share";
import { getCustomerSegments } from "@/actions/customers";
import { getProductCategories } from "@/actions/product-catalog";
import ShareClient from "./client";

export default async function CatalogueSharePage() {
  const session = await requireSession();
  const [links, segments, categories] = await Promise.all([
    getCatalogueLinks(),
    getCustomerSegments(),
    getProductCategories(),
  ]);

  return (
    <ShareClient
      links={links}
      segments={segments}
      categories={categories}
      businessName={session.businessName}
    />
  );
}
