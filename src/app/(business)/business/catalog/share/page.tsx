import { requireSession } from "@/lib/auth/guards";
import { getCatalogueLinks } from "@/actions/catalogue-share";
import { getCustomerSegments } from "@/actions/customers";
import ShareClient from "./client";

export default async function CatalogueSharePage() {
  const session = await requireSession();
  const [links, segments] = await Promise.all([
    getCatalogueLinks(),
    getCustomerSegments(),
  ]);

  return (
    <ShareClient
      links={links}
      segments={segments}
      businessName={session.businessName}
    />
  );
}
