"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Plus, Trash2, Copy, Check, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { updateBusinessPassword, deleteBusinessAccount } from "@/actions/business-auth";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

interface Category {
  id: string;
  name: string;
  monthly_budget: number | null;
}

interface Props {
  businessInfo: {
    id: string;
    name: string;
    industry: string | null;
    invite_code: string | null;
    currency: string;
  } | null;
  categories: Category[];
  role: "owner" | "admin" | "member";
  hasPassword: boolean;
}

function ChangePasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [isGoogle, setIsGoogle] = useState(!hasPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const formData = new FormData();
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);
    if (!isGoogle) formData.set("currentPassword", currentPassword);

    const result = await updateBusinessPassword(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(isGoogle ? "Password set successfully" : "Password updated successfully");
      if (isGoogle) setIsGoogle(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPending(false);
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isGoogle ? "Set Password" : "Change Password"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isGoogle
            ? "Set a password so you can sign in with email."
            : "Update your password. You'll need your current password for verification."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isGoogle && (
            <div className="space-y-1.5">
              <Label htmlFor="biz-current-password" className="text-sm">
                Current Password
              </Label>
              <Input
                id="biz-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-muted/30 border-border/50 h-9"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="biz-new-password" className="text-sm">
              New Password
            </Label>
            <Input
              id="biz-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-muted/30 border-border/50 h-9"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-confirm-password" className="text-sm">
              Confirm New Password
            </Label>
            <Input
              id="biz-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-muted/30 border-border/50 h-9"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" size="sm" className="gap-2 h-9" disabled={pending}>
            <Lock className="h-3.5 w-3.5" />
            {pending
              ? "Updating..."
              : isGoogle
                ? "Set Password"
                : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DeleteBusinessCard({ businessName }: { businessName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) setInput("");
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteBusinessAccount(input);
    if (result?.error) {
      toast.error(result.error);
      setPending(false);
    } else {
      toast.success("Business account deleted");
      router.push("/business/login");
    }
  }

  const nameMatches = input.trim() === businessName.trim();

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-destructive">Delete Business Account</CardTitle>
        <CardDescription className="text-xs">
          Archive this business and all its data — expenses, members, products, and sales. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="h-9 gap-2" />
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Business Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Business Account</DialogTitle>
              <DialogDescription>
                This will permanently archive{" "}
                <strong className="text-foreground">{businessName}</strong> and
                all associated data. Type the business name below to confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-1">
              <Label htmlFor="confirm-biz-name" className="text-sm">
                Type{" "}
                <span className="font-mono font-semibold">{businessName}</span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-biz-name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={businessName}
                className="bg-muted/30 border-border/50 h-9"
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" size="sm" />}>
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                size="sm"
                disabled={!nameMatches || pending}
                onClick={handleDelete}
              >
                {pending ? "Deleting..." : "Delete Business"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function SettingsClient({
  businessInfo,
  categories: initialCategories,
  role,
  hasPassword,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const isManagement = role === "owner" || role === "admin";

  function copyInviteCode() {
    if (businessInfo?.invite_code) {
      navigator.clipboard.writeText(businessInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function addCategory() {
    if (!newCatName.trim() || !businessInfo) return;
    setIsAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("business_categories")
      .insert({
        business_id: businessInfo.id,
        name: newCatName.trim(),
        monthly_budget: newCatBudget ? parseFloat(newCatBudget) : null,
      })
      .select("id, name, monthly_budget")
      .single();

    if (error) {
      toast.error(error.message);
    } else if (data) {
      setCategories((prev) => [...prev, data]);
      setNewCatName("");
      setNewCatBudget("");
      toast.success("Category added");
    }
    setIsAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("business_categories")
      .delete()
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6 max-w-2xl"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          {isManagement ? "Business Settings" : "Settings"}
        </h1>
      </motion.div>

      {/* Change password — member only (management sees it at the bottom) */}
      {!isManagement && (
        <motion.div variants={fadeUp}>
          <ChangePasswordCard hasPassword={hasPassword} />
        </motion.div>
      )}

      {/* Business info — management only */}
      {isManagement && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{businessInfo?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{businessInfo?.industry ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invite Code</span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 font-mono text-primary text-xs bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {businessInfo?.invite_code}
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Expense categories — management only */}
      {isManagement && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Expense Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-border/30">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.monthly_budget && (
                        <p className="text-xs text-muted-foreground">
                          Budget: ₹{Number(c.monthly_budget).toLocaleString("en-IN")} / month
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border/30 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Add Category
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="bg-muted/30 border-border/50 h-9 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  />
                  <Input
                    placeholder="Budget (optional)"
                    type="number"
                    value={newCatBudget}
                    onChange={(e) => setNewCatBudget(e.target.value)}
                    className="bg-muted/30 border-border/50 h-9 w-36"
                  />
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 shrink-0"
                    onClick={addCategory}
                    disabled={!newCatName.trim() || isAdding}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Change password — management only, at the bottom */}
      {isManagement && (
        <motion.div variants={fadeUp}>
          <ChangePasswordCard hasPassword={hasPassword} />
        </motion.div>
      )}

      {/* Delete business account — owner only */}
      {role === "owner" && businessInfo && (
        <motion.div variants={fadeUp}>
          <DeleteBusinessCard businessName={businessInfo.name} />
        </motion.div>
      )}
    </motion.div>
  );
}
