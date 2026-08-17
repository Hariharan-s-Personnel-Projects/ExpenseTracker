import { requireNonSalesSession } from "@/lib/auth/guards";
import { getBusinessDashboardStats, getBusinessExpenses } from "@/actions/business-expenses";
import { getSalesAnalytics, getInventoryStats } from "@/actions/analytics";
import AnalyticsClient from "./client";

export default async function AnalyticsPage() {
  const session = await requireNonSalesSession();

  const isRetail = session.industry === "Retail";

  const [stats, { expenses }, salesAnalytics, inventoryStats] = await Promise.all([
    getBusinessDashboardStats(),
    getBusinessExpenses({ status: "approved", limit: 500 }),
    isRetail ? getSalesAnalytics() : Promise.resolve(null),
    isRetail ? getInventoryStats() : Promise.resolve(null),
  ]);

  return (
    <AnalyticsClient
      stats={stats}
      expenses={expenses}
      salesAnalytics={salesAnalytics}
      inventoryStats={inventoryStats}
      isRetail={isRetail}
    />
  );
}
