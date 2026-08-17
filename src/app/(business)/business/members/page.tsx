import { requireManagementSession } from "@/lib/auth/guards";
import { getBusinessMembers } from "@/actions/business-expenses";
import { getBusinessInfo } from "@/actions/business-auth";
import MembersClient from "./client";

export default async function MembersPage() {
  const session = await requireManagementSession();

  const [members, info] = await Promise.all([
    getBusinessMembers(),
    getBusinessInfo(),
  ]);

  return (
    <MembersClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members={members as any}
      inviteCode={info?.invite_code ?? null}
      role={session.role}
    />
  );
}
