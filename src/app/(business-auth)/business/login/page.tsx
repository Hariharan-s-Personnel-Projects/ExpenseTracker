"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Briefcase,
  Users,
  BarChart3,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { businessOwnerLogin, memberLogin, selectBusiness } from "@/actions/business-auth";

type TabType = "owner" | "member";

interface Business {
  id: string;
  name: string;
  role: "owner" | "admin";
}

interface MultipleBusinessState {
  businesses: Business[];
  userId: string;
  email: string;
}

function LoginForm() {
  const [tab, setTab] = useState<TabType>("owner");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [multipleBusinesses, setMultipleBusinesses] =
    useState<MultipleBusinessState | null>(null);

  async function handleOwnerLogin(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const res = await businessOwnerLogin(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else if (res?.businesses) {
      setMultipleBusinesses({
        businesses: res.businesses as Business[],
        userId: res.userId!,
        email: res.email!,
      });
      setIsLoading(false);
    }
  }

  async function handleMemberLogin(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const res = await memberLogin(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
  }

  async function handleSelectBusiness(businessId: string) {
    if (!multipleBusinesses) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("userId", multipleBusinesses.userId);
    formData.set("email", multipleBusinesses.email);
    const res = await selectBusiness(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    }
  }

  if (multipleBusinesses) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Select a Business</h2>
          <p className="text-muted-foreground text-sm">
            You have multiple businesses. Choose one to continue.
          </p>
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        <div className="space-y-3">
          {multipleBusinesses.businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => handleSelectBusiness(biz.id)}
              disabled={isLoading}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{biz.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{biz.role}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
        <button
          onClick={() => setMultipleBusinesses(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to sign in
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-md space-y-8"
    >
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Business Sign In</h1>
        <p className="text-muted-foreground">
          Access your business expense dashboard.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="relative flex rounded-xl bg-muted/40 p-1 border border-border/50">
        <motion.div
          className="absolute inset-y-1 rounded-lg bg-background border border-border/50 shadow-sm"
          style={{ width: "calc(50% - 2px)" }}
          animate={{ x: tab === "owner" ? 2 : "calc(100% + 2px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        {(["owner", "member"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "owner" ? "Owner / Admin" : "Team Member"}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === "owner" ? (
          <motion.form
            key="owner"
            action={handleOwnerLogin}
            className="space-y-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email</Label>
                <Input
                  id="owner-email"
                  name="email"
                  type="email"
                  placeholder="owner@company.com"
                  required
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-password">Password</Label>
                <Input
                  id="owner-password"
                  name="password"
                  type="password"
                  required
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In as Owner"}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="member"
            action={handleMemberLogin}
            className="space-y-5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-password">Password</Label>
                <Input
                  id="member-password"
                  name="password"
                  type="password"
                  required
                  className="bg-muted/30 border-border/50 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Business Invite Code</Label>
                <Input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  placeholder="e.g. a1b2c3d4e5"
                  required
                  className="bg-muted/30 border-border/50 h-11 font-mono tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Get this code from your business owner.
                </p>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Join Business"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="text-center text-sm text-muted-foreground pt-2 space-y-2">
        <p>
          New business?{" "}
          <Link href="/business/signup" className="text-primary hover:underline font-medium">
            Register your business
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

export default function BusinessLoginPage() {
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
            Manage every business expense in one place.
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            Submit, approve, and track team expenses with real-time dashboards and category budgets.
          </motion.p>

          <div className="space-y-4 pt-8">
            {[
              { icon: Users, text: "Team-based expense submission & approvals" },
              { icon: BarChart3, text: "Category budgets and spend analytics" },
              { icon: Briefcase, text: "Full audit trail for every transaction" },
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
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative">
        <Link href="/" className="md:hidden absolute top-8 left-8 flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker AI</span>
        </Link>
        <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
