"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Lock } from "lucide-react";
import { useUserBudget, useUpdateBudget } from "@/hooks/useExpenses";
import { updatePassword } from "@/actions/auth";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data, isLoading } = useUserBudget();
  const { mutate: updateBudget, isPending } = useUpdateBudget();
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    if (data?.monthlyBudget !== undefined) {
      setMonthlyLimit(String(data.monthlyBudget));
    }
  }, [data?.monthlyBudget]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(monthlyLimit);
    if (!isNaN(value) && value >= 0) {
      updateBudget(value);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordPending(true);

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const result = await updatePassword(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordPending(false);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto pb-6 sm:pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account preferences and budget configurations.
        </p>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Budget Preferences</CardTitle>
          <CardDescription>
            Set your global monthly budget limits for tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Limit (₹)</Label>
              <Input
                id="monthly-limit"
                type="number"
                min={0}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="gap-2"
              disabled={isLoading || isPending}
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your account password. You'll need to enter your current
            password for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="gap-2" disabled={passwordPending}>
              <Lock className="h-4 w-4" />
              {passwordPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
