import { requireNonSalesSession, canManage } from "@/lib/auth/guards";
import { getBusinessInfo, getBusinessUserAuthInfo } from "@/actions/business-auth";
import { getBusinessCategories } from "@/actions/business-expenses";
import SettingsClient from "./client";

export default async function BusinessSettingsPage() {
  const session = await requireNonSalesSession();
  const authInfo = await getBusinessUserAuthInfo();
  const hasPassword = !(authInfo?.isGoogle ?? false);

  if (!canManage(session.role)) {
    return (
      <SettingsClient
        businessInfo={null}
        categories={[]}
        role={session.role}
        hasPassword={hasPassword}
      />
    );
  }

  const [info, categories] = await Promise.all([
    getBusinessInfo(),
    getBusinessCategories(),
  ]);

  return (
    <SettingsClient
      businessInfo={info}
      categories={categories}
      role={session.role}
      hasPassword={hasPassword}
    />
  );
}
