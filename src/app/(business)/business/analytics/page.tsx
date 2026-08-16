import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getBusinessDashboardStats, getBusinessExpenses } from "@/actions/business-expenses";
import AnalyticsClient from "./client";

export default async function AnalyticsPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  const [stats, { expenses }] = await Promise.all([
    getBusinessDashboardStats(),
    getBusinessExpenses({ status: "approved", limit: 200 }),
  ]);

  return <AnalyticsClient stats={stats} expenses={expenses} />;
}
