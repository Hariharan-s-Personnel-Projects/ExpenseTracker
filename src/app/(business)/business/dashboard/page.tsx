import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getBusinessDashboardStats, getBusinessExpenses } from "@/actions/business-expenses";
import { getBusinessInfo } from "@/actions/business-auth";
import BusinessDashboardClient from "./client";

export default async function BusinessDashboardPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.role === "sales") redirect("/business/sales");

  const [stats, info, recentResult] = await Promise.all([
    getBusinessDashboardStats(),
    getBusinessInfo(),
    getBusinessExpenses({ limit: 5 }),
  ]);

  return (
    <BusinessDashboardClient
      stats={stats}
      businessInfo={info}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentExpenses={recentResult.expenses as any}
      role={session.role}
    />
  );
}
