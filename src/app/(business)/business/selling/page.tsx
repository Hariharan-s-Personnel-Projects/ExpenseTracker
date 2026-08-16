import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getSellingData } from "@/actions/selling";
import SellingClient from "./client";

export default async function SellingPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

  const groups = await getSellingData();

  return <SellingClient groups={groups} role={session.role} />;
}
