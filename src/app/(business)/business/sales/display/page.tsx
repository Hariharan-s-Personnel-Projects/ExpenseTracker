import { requireRetailAccess } from "@/lib/auth/guards";
import { getCustomerSegments } from "@/actions/customers";
import CatalogDisplayClient from "./client";

export default async function CatalogDisplayPage() {
  const session = await requireRetailAccess();

  const segments = await getCustomerSegments();

  return (
    <CatalogDisplayClient
      businessName={session.businessName}
      segments={segments}
    />
  );
}
