import { redirect, notFound } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getCategoryDetails, getAcquisitionLogs } from "@/actions/product-catalog";
import CategoryClient from "./client";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");

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
      acquisitionLogs={logs}
    />
  );
}
