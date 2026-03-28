"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bot, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { signup, loginWithGoogle } from "@/actions/auth";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogle("signup");
    if (res?.error) {
      setError(res.error);
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    // Basic password confirmation check inline
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    const res = await signup(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row-reverse relative">
      {/* Right Panel: Branding & Features (Hidden on mobile) */}
      <div className="hidden border-l border-border md:flex flex-1 flex-col justify-between overflow-hidden bg-muted/30 relative p-12">
        <div className="flex justify-end relative z-10 w-full">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">Tracker AI</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-md mt-20 ml-auto mr-0">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Start mastering your money today.
          </h2>
          <p className="text-muted-foreground text-lg">
            Sign up now and experience the power of AI-driven expense insights
            tailored just for you.
          </p>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Bot className="h-5 w-5 text-primary" />
              <p>Interact with your intelligent financial AI</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <Wallet className="h-5 w-5 text-primary" />
              <p>Weekly budget allocation tracking</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <TrendingUp className="h-5 w-5 text-primary" />
              <p>Beautiful animated analytics</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground mt-8 text-right">
          © {new Date().getFullYear()} Tracker AI. All rights reserved.
        </div>
      </div>

      {/* Left Panel: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        {/* Mobile Logo */}
        <Link
          href="/"
          className="md:hidden absolute top-8 right-8 flex items-center gap-2 group"
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
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Create an account
            </h1>
            <p className="text-muted-foreground">
              Enter your email and a secure password.
            </p>
          </div>

          <form action={handleSubmit} className="space-y-6 mt-8">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
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
                  required
                  minLength={6}
                  className="bg-muted/30 border-border/50 focus-visible:ring-primary/50 h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base shadow-md transition-transform active:scale-95"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-base gap-3 border-border/50 hover:bg-muted/30 transition-transform active:scale-95"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              Log in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
