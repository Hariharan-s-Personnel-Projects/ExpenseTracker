"use client";

import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  ArrowLeft,
  Lock,
  Mail,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { verifyResetToken, resetPassword } from "@/actions/password-reset";
import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError("Invalid reset link. No token provided.");
        setIsVerifying(false);
        return;
      }

      const res = await verifyResetToken(token);
      if (res.error) {
        setError(res.error);
      } else {
        setIsValid(true);
        setEmail(res.email || null);
      }
      setIsVerifying(false);
    }

    verify();
  }, [token]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    formData.append("token", token);
    const res = await resetPassword(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-md flex flex-col items-center justify-center space-y-4"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          Verifying your reset link...
        </p>
      </motion.div>
    );
  }

  if (!isValid && !success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 text-center md:text-left"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Invalid Reset Link
          </h1>
          <p className="text-muted-foreground">
            {error || "This reset link is invalid or has expired."}
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <Link href="/forgot-password">
            <Button className="w-full h-11 text-base">
              Request a New Link
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full h-11 text-base gap-2 mt-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6 text-center md:text-left"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Password Updated
          </h1>
          <p className="text-muted-foreground">
            Your password has been successfully reset. You can now sign in with
            your new password.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login">
            <Button className="w-full h-11 text-base gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Sign In
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md space-y-6 text-center md:text-left"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
        <p className="text-muted-foreground">
          {email
            ? "Enter a new password for your account."
            : "Choose a strong new password for your account."}
        </p>
      </div>

      {email && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 border border-border/50 px-4 py-3">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-foreground font-medium truncate">
            {email}
          </span>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              required
              minLength={6}
              className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base shadow-md transition-transform active:scale-95"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-4">
        <Link
          href="/login"
          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-primary/[0.05] blur-[150px] animate-glow-pulse" />
        <div
          className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-chart-2/[0.04] blur-[120px] animate-glow-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Left Panel */}
      <div className="hidden border-r border-border/30 md:flex flex-1 flex-col justify-between overflow-hidden bg-muted/[0.03] relative p-12">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/[0.08] blur-[150px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-glow-pulse" />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-chart-3/[0.06] blur-[120px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/3 animate-glow-pulse"
          style={{ animationDelay: "1.5s" }}
        />

        <Link
          href="/"
          className="relative z-10 flex items-center gap-2 group w-fit"
        >
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Tracker AI</span>
        </Link>

        <div className="relative z-10 space-y-6 max-w-md mt-20">
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-primary/70">
            Almost there.
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose a strong new password to secure your account and get back to
            tracking your finances.
          </p>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Lock className="h-5 w-5 text-primary" />
              <p>Choose a strong, unique password</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p>Your account stays secure</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground mt-8">
          © {new Date().getFullYear()} Tracker AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        <Link
          href="/"
          className="md:hidden absolute top-8 left-8 flex items-center gap-2 group"
        >
          <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker AI</span>
        </Link>

        <Suspense
          fallback={
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
