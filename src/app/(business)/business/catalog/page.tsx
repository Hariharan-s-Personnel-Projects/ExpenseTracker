import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getProductCategories } from "@/actions/product-catalog";
import CatalogClient from "./client";

export default async function CatalogPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.industry !== "Retail") redirect("/business/dashboard");
  if (session.role === "sales") redirect("/business/sales");

  const categories = await getProductCategories();

  return <CatalogClient categories={categories} role={session.role} />;
}
