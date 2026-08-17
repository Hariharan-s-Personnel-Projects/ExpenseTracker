import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getRecentSales } from "@/actions/sales";
import SalesListClient from "./client";

export default async function FinanceSalesPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  const sales = await getRecentSales(500);

  return <SalesListClient sales={sales} />;
}
