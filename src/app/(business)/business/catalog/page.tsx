import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getProductCategories } from "@/actions/product-catalog";
import CatalogClient from "./client";

export default async function CatalogPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  const categories = await getProductCategories();

  return <CatalogClient categories={categories} role={session.role} />;
}
