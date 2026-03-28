"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { Lock } from "lucide-react";
import { updatePassword, setPassword, getUserAuthInfo } from "@/actions/auth";
import { toast } from "sonner";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [isGoogle, setIsGoogle] = useState<boolean | null>(null);

  useEffect(() => {
    getUserAuthInfo().then((info) => {
      setIsGoogle(info?.isGoogle ?? false);
    });
  }, []);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordPending(true);

    const formData = new FormData();
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    let result;
    if (isGoogle) {
      result = await setPassword(formData);
    } else {
      formData.set("currentPassword", currentPassword);
      result = await updatePassword(formData);
    }

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(
        isGoogle
          ? "Password set successfully"
          : "Password updated successfully",
      );
      if (isGoogle) {
        setIsGoogle(false);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordPending(false);
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account preferences and budget configurations.
        </p>
      </motion.div>

      {isGoogle !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>
                {isGoogle ? "Set Password" : "Change Password"}
              </CardTitle>
              <CardDescription>
                {isGoogle
                  ? "Set a password for your account so you can also sign in with email."
                  : "Update your account password. You'll need to enter your current password for verification."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                {!isGoogle && (
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
                )}

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

                <Button
                  type="submit"
                  className="gap-2"
                  disabled={passwordPending}
                >
                  <Lock className="h-4 w-4" />
                  {passwordPending
                    ? "Updating..."
                    : isGoogle
                      ? "Set Password"
                      : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
