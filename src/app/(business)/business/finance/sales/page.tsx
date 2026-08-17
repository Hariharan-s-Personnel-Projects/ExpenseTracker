import { requireNonSalesSession } from "@/lib/auth/guards";
import { getRecentSales } from "@/actions/sales";
import SalesListClient from "./client";

export default async function FinanceSalesPage() {
  await requireNonSalesSession();

  const sales = await getRecentSales(500);

  return <SalesListClient sales={sales} />;
}
