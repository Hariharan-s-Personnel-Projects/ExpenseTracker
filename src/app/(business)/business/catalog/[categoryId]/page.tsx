import { notFound } from "next/navigation";
import { requireRetailSession } from "@/lib/auth/guards";
import { getCategoryDetails, getAcquisitionLogs } from "@/actions/product-catalog";
import CategoryClient from "./client";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireRetailSession();

  const { categoryId } = await params;
  const [data, logs] = await Promise.all([
    getCategoryDetails(categoryId),
    getAcquisitionLogs(categoryId),
  ]);
  if (!data) notFound();

  return (
    <CategoryClient
      category={data.category}
      costColumns={data.costColumns}
      products={data.products}
      role={data.role}
      businessId={data.businessId}
      acquisitionLogs={logs}
    />
  );
}
