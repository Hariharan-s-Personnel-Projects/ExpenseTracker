import { requireManagementSession } from "@/lib/auth/guards";
import { getBusinessExpenses } from "@/actions/business-expenses";
import ApprovalsClient from "./client";

export default async function ApprovalsPage() {
  await requireManagementSession();

  const { expenses, total } = await getBusinessExpenses({ status: "pending", limit: 100 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ApprovalsClient expenses={expenses as any} total={total} />;
}
