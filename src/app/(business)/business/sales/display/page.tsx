import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCustomerSegments } from "@/actions/customers";
import CatalogDisplayClient from "./client";

export default async function CatalogDisplayPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  const segments = await getCustomerSegments();

  return (
    <CatalogDisplayClient
      businessName={session.businessName}
      segments={segments}
    />
  );
}
