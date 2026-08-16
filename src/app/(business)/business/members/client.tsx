"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Copy, Check, Shield, UserMinus, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateMemberRole, removeMember } from "@/actions/business-expenses";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const roleConfig = {
  owner: { label: "Owner", icon: Crown, class: "bg-primary/10 text-primary border-primary/20" },
  admin: { label: "Admin", icon: Shield, class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  member: { label: "Member", icon: Users, class: "bg-muted text-muted-foreground border-border" },
};

interface Member {
  id: string;
  role: string;
  joined_at: string;
  users: { id: string; email: string } | null;
}

interface Props {
  members: Member[];
  inviteCode: string | null;
  role: "owner" | "admin";
}

export default function MembersClient({ members, inviteCode, role }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function copyInviteCode() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRoleChange(memberId: string, newRole: "admin" | "member") {
    setLoadingId(memberId);
    const res = await updateMemberRole(memberId, newRole);
    if (res?.error) toast.error(res.error);
    else { toast.success("Role updated"); router.refresh(); }
    setLoadingId(null);
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this member from the business?")) return;
    setLoadingId(memberId);
    const res = await removeMember(memberId);
    if (res?.error) toast.error(res.error);
    else { toast.success("Member removed"); router.refresh(); }
    setLoadingId(null);
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Team Members
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Invite code */}
      {inviteCode && (
        <motion.div variants={fadeUp}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-sm">Team Invite Code</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Share this code with team members so they can join at{" "}
                    <span className="font-mono text-foreground">/business/login</span>.
                  </p>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-mono font-medium text-sm transition-all"
                >
                  {inviteCode}
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Members list */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {members.map((m) => {
                const rc = roleConfig[m.role as keyof typeof roleConfig] ?? roleConfig.member;
                const RoleIcon = rc.icon;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/15 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary uppercase">
                          {(m.users?.email ?? "?")[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.users?.email ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(m.joined_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {m.role === "owner" ? (
                        <Badge variant="outline" className={`gap-1.5 ${rc.class}`}>
                          <RoleIcon className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : role === "owner" ? (
                        <>
                          <Select
                            value={m.role}
                            options={["admin", "member"]}
                            onChange={(v) => handleRoleChange(m.id, v as "admin" | "member")}
                            className="w-28 h-7 text-xs bg-muted/30 border-border/50"
                          />
                          <button
                            onClick={() => handleRemove(m.id)}
                            disabled={loadingId === m.id}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <Badge variant="outline" className={rc.class}>
                          {rc.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
