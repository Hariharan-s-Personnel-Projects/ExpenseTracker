import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCustomerSegments } from "@/actions/customers";
import { getSalesProducts, getRecentSales } from "@/actions/sales";
import SalesClient from "./client";

export default async function SalesPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

  const [segments, recentSales] = await Promise.all([
    getCustomerSegments(),
    getRecentSales(50),
  ]);

  const initialProducts = segments.length > 0
    ? await getSalesProducts(segments[0].id)
    : [];

  return (
    <SalesClient
      segments={segments}
      initialProducts={initialProducts}
      initialSegmentId={segments[0]?.id ?? null}
      recentSales={recentSales}
      role={session.role}
    />
  );
}
