import { requireRetailSession } from "@/lib/auth/guards";
import { getCustomerSegments } from "@/actions/customers";
import { getSellingData } from "@/actions/selling";
import SellingClient from "./client";

export default async function SellingPage() {
  const session = await requireRetailSession();

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
