import { requireManagementSession } from "@/lib/auth/guards";
import { getBusinessInfo } from "@/actions/business-auth";
import { getBusinessCategories } from "@/actions/business-expenses";
import SettingsClient from "./client";

export default async function BusinessSettingsPage() {
  const session = await requireManagementSession();

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
