import { requireRetailAccess } from "@/lib/auth/guards";
import { getCustomerSegments } from "@/actions/customers";
import { getRecentSales } from "@/actions/sales";
import SalesClient from "./client";

export default async function SalesPage() {
  const session = await requireRetailAccess();

  const [segments, recentSales] = await Promise.all([
    getCustomerSegments(),
    getRecentSales(50),
  ]);

  return (
    <SalesClient
      segments={segments}
      recentSales={recentSales}
      role={session.role}
    />
  );
}
