"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Copy, Check, Shield, UserMinus, Crown, UserPlus, AlertCircle, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateMemberRole, removeMember } from "@/actions/business-expenses";
import { addBusinessMember } from "@/actions/business-auth";
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
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

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

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    const fd = new FormData();
    fd.set("email", addEmail);
    fd.set("initialPassword", addPassword);
    const res = await addBusinessMember(fd);
    if (res?.error) {
      setAddError(res.error);
    } else {
      const msg = res.isNewUser
        ? `Account created and ${addEmail} added as a member.`
        : `${addEmail} added as a member.`;
      toast.success(msg);
      setAddEmail("");
      setAddPassword("");
      router.refresh();
    }
    setAddLoading(false);
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
                    Members need this code + their credentials to sign in at{" "}
                    <span className="font-mono text-foreground">/business/login</span>.
                    Add them below first.
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

      {/* Add Member */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Add Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              {addError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{addError}</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="addEmail" className="text-xs">Member Email</Label>
                  <Input
                    id="addEmail"
                    type="email"
                    placeholder="member@company.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    required
                    className="bg-muted/30 border-border/50 h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addPassword" className="text-xs">
                    Initial Password{" "}
                    <span className="text-muted-foreground font-normal">(only if new account)</span>
                  </Label>
                  <Input
                    id="addPassword"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="bg-muted/30 border-border/50 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <p>
                  If the email already has an account, they are added directly. Otherwise a new account is
                  created — share the email and initial password with them so they can sign in.
                </p>
              </div>
              <Button
                type="submit"
                size="sm"
                className="gap-2"
                disabled={addLoading || !addEmail}
              >
                {addLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Add Member
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

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
