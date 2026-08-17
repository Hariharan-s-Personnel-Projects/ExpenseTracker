import { requireRetailAccess } from "@/lib/auth/guards";
import { getInventory } from "@/actions/inventory";
import InventoryClient from "./client";

export default async function InventoryPage() {
  const session = await requireRetailAccess();

  const groups = await getInventory();

  return <InventoryClient groups={groups} role={session.role} />;
}
