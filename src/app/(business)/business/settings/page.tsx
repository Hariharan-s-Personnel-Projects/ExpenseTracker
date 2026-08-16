import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getBusinessInfo } from "@/actions/business-auth";
import { getBusinessCategories } from "@/actions/business-expenses";
import SettingsClient from "./client";

export default async function BusinessSettingsPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.role === "member") redirect("/business/dashboard");

  const [info, categories] = await Promise.all([
    getBusinessInfo(),
    getBusinessCategories(),
  ]);

  return (
    <SettingsClient
      businessInfo={info}
      categories={categories}
      role={session.role}
    />
  );
}
