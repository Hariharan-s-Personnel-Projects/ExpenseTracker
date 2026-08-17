import { requireRetailSession } from "@/lib/auth/guards";
import { getCustomerSegments } from "@/actions/customers";
import CustomersClient from "./client";

export default async function CustomersPage() {
  const session = await requireRetailSession();

  const segments = await getCustomerSegments();

  return <CustomersClient segments={segments} role={session.role} />;
}
