import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCustomerSegments } from "@/actions/customers";
import CustomersClient from "./client";

export default async function CustomersPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  const segments = await getCustomerSegments();

  return <CustomersClient segments={segments} role={session.role} />;
}
