import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getBusinessExpenses } from "@/actions/business-expenses";
import ApprovalsClient from "./client";

export default async function ApprovalsPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.role === "member") redirect("/business/dashboard");

  const { expenses, total } = await getBusinessExpenses({ status: "pending", limit: 100 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ApprovalsClient expenses={expenses as any} total={total} />;
}
