"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { businessOwnerSignup, loginWithGoogleBusiness } from "@/actions/business-auth";

const BUSINESS_CATEGORIES = [
  "Technology",
  "Retail",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Education",
  "Hospitality",
  "Consulting",
  "Real Estate",
  "Media & Entertainment",
  "Logistics",
  "Other",
];

function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [industry, setIndustry] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    if (industry) formData.set("industry", industry);
    const res = await businessOwnerSignup(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogleBusiness("signup");
    if (res?.error) {
      setError(res.error);
      setIsGoogleLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-md space-y-8"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Register your business</h1>
        <p className="text-muted-foreground">
          Create a business account to manage team expenses and approvals.
        </p>
      </div>

      <motion.form
        action={handleSubmit}
        className="space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Your Account
          </p>
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jane Smith"
                required
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane@company.com"
                required
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 characters"
                required
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-4 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Business Details
          </p>
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="Acme Corp"
                required
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Category</Label>
              <Select
                value={industry}
                options={BUSINESS_CATEGORIES}
                onChange={setIndustry}
                placeholder="Select category (optional)"
                className="bg-muted/30 border-border/50 h-11"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97]"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Create Business Account"
          )}
        </Button>
      </motion.form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 text-base gap-3 border-border/50 hover:bg-muted/30 transition-all duration-200 active:scale-[0.97] hover:border-primary/30"
        onClick={handleGoogleSignup}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Sign up with Google
      </Button>

      <div className="text-center text-sm text-muted-foreground pt-2 space-y-2">
        <p>
          Already registered?{" "}
          <Link href="/business/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
        <p>
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            ← Personal account
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function BusinessSignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Left panel */}
      <div className="hidden border-r border-border md:flex flex-1 flex-col justify-between overflow-hidden bg-muted/30 relative p-12">
        <Link href="/" className="relative z-10 flex items-center gap-2 group w-fit">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors border border-primary/20">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Tracker AI</span>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
            Business
          </span>
        </Link>

        <div className="relative z-10 space-y-6 max-w-md mt-20">
          <motion.h2
            className="text-4xl font-bold tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Everything your team needs to track spending.
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            Set up in minutes. Invite your team. Approve expenses with one click.
          </motion.p>

          <div className="space-y-4 pt-8">
            {[
              { icon: Users, text: "Invite unlimited team members" },
              { icon: ShieldCheck, text: "Role-based approval workflows" },
              { icon: TrendingUp, text: "Real-time budget vs. spend analytics" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-3 text-sm text-foreground/80"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              >
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground mt-8">
          © {new Date().getFullYear()} Tracker AI Business. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative overflow-y-auto">
        <Link href="/" className="md:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker AI</span>
        </Link>
        <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
