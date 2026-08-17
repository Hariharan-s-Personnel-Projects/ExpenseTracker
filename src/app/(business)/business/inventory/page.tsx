import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getInventory } from "@/actions/inventory";
import InventoryClient from "./client";

export default async function InventoryPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

  const groups = await getInventory();

  return <InventoryClient groups={groups} role={session.role} />;
}
