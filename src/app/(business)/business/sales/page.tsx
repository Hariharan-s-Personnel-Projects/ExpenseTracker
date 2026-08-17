import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCustomerSegments } from "@/actions/customers";
import { getRecentSales } from "@/actions/sales";
import SalesClient from "./client";

export default async function SalesPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

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
