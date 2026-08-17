import { requireSession, canManage } from "@/lib/auth/guards";
import {
  getBusinessInfo,
  getBusinessUserAuthInfo,
  getBusinessContact,
} from "@/actions/business-auth";
import { getBusinessCategories } from "@/actions/business-expenses";
import SettingsClient from "./client";

export default async function BusinessSettingsPage() {
  const session = await requireSession();
  const authInfo = await getBusinessUserAuthInfo();
  const hasPassword = authInfo?.hasPassword ?? false;

  if (!canManage(session.role)) {
    return (
      <SettingsClient
        businessInfo={null}
        categories={[]}
        contactInfo={null}
        role={session.role}
        hasPassword={hasPassword}
      />
    );
  }

  const [info, categories, contactInfo] = await Promise.all([
    getBusinessInfo(),
    getBusinessCategories(),
    getBusinessContact(),
  ]);

  return (
    <SettingsClient
      businessInfo={info}
      categories={categories}
      contactInfo={contactInfo}
      role={session.role}
      hasPassword={hasPassword}
    />
  );
}
