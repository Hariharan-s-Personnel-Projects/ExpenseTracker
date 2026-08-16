import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { getBusinessMembers } from "@/actions/business-expenses";
import { getBusinessInfo } from "@/actions/business-auth";
import MembersClient from "./client";

export default async function MembersPage() {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");
  if (session.role === "member") redirect("/business/dashboard");

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
