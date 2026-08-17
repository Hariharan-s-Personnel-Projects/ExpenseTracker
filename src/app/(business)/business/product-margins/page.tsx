import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCustomerSegments } from "@/actions/customers";
import { getSellingData } from "@/actions/selling";
import SellingClient from "./client";

export default async function SellingPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

  const segments = await getCustomerSegments();
  const initialGroups = segments.length > 0
    ? await getSellingData(segments[0].id)
    : [];

  return (
    <SellingClient
      segments={segments}
      initialGroups={initialGroups}
      initialSegmentId={segments[0]?.id ?? null}
      role={session.role}
    />
  );
}
