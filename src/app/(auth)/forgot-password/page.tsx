"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/password-reset";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const res = await requestPasswordReset(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setEmailSent(true);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Left Panel */}
      <div className="hidden border-r border-border md:flex flex-1 flex-col justify-between overflow-hidden bg-muted/30 relative p-12">
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
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Forgot your password?
          </h2>
          <p className="text-muted-foreground text-lg">
            No worries — it happens to the best of us. We'll send you a link to
            reset your password.
          </p>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Mail className="h-5 w-5 text-primary" />
              <p>We'll send a reset link to your email</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p>Click the link and set a new password</p>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          {emailSent ? (
            <div className="space-y-6 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  Check your email
                </h1>
                <p className="text-muted-foreground">
                  We've sent a password reset link to your email address. The
                  link will expire in a few minutes, so please check your inbox
                  soon.
                </p>
              </div>
              <div className="space-y-3 pt-4">
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight">
                  Reset Password
                </h1>
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              <form action={handleSubmit} className="space-y-6 mt-8">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base shadow-md transition-transform active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
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
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
