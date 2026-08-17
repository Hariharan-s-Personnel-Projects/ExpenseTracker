"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  RotateCcw,
  PlusCircle,
} from "lucide-react";
import {
  businessOwnerLogin,
  memberLogin,
  selectBusiness,
  loginWithGoogleBusiness,
  getGoogleBusinessSelect,
  retainDeletedBusiness,
  createFreshBusinessAfterDeletion,
} from "@/actions/business-auth";
import { useSearchParams } from "next/navigation";

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

interface DeletedBusinessState {
  businessId: string;
  businessName: string;
  deletedAt: string;
  userId: string;
  email: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabType>("owner");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [multipleBusinesses, setMultipleBusinesses] =
    useState<MultipleBusinessState | null>(null);
  const [deletedBusiness, setDeletedBusiness] =
    useState<DeletedBusinessState | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) setError(errorParam);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("googleSelect") === "1") {
      getGoogleBusinessSelect().then((data) => {
        if (data) setMultipleBusinesses(data);
        else setError("Session expired. Please try signing in again.");
      });
    }
  }, [searchParams]);

  async function handleOwnerLogin(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const res = await businessOwnerLogin(formData);
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else if (res?.deletedBusiness) {
      setDeletedBusiness({
        businessId: res.deletedBusiness.id,
        businessName: res.deletedBusiness.name,
        deletedAt: res.deletedBusiness.deletedAt,
        userId: res.userId!,
        email: res.email!,
      });
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

  async function handleRetainBusiness() {
    if (!deletedBusiness) return;
    setIsLoading(true);
    setError(null);
    const res = await retainDeletedBusiness(
      deletedBusiness.businessId,
      deletedBusiness.userId,
      deletedBusiness.email
    );
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push("/business/dashboard");
    }
  }

  async function handleCreateNewBusiness() {
    if (!deletedBusiness) return;
    setIsLoading(true);
    setError(null);
    const res = await createFreshBusinessAfterDeletion(
      deletedBusiness.businessId,
      deletedBusiness.userId,
      deletedBusiness.email
    );
    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push("/business/dashboard");
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

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogleBusiness("login");
    if (res?.error) {
      setError(res.error);
      setIsGoogleLoading(false);
    }
  }

  if (deletedBusiness) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Account Found</h2>
          <p className="text-muted-foreground text-sm">
            A deleted business account was found linked to this email.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{deletedBusiness.businessName}</p>
              <p className="text-xs text-muted-foreground">
                Deleted on{" "}
                {new Date(deletedBusiness.deletedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Would you like to restore this account and all its data, or start fresh with a new business?
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            className="w-full h-11 gap-2"
            onClick={handleRetainBusiness}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Restore Business Account
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 gap-2 border-border/50 hover:bg-muted/30"
            onClick={handleCreateNewBusiness}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            Start Fresh
          </Button>
        </div>

        <button
          onClick={() => { setDeletedBusiness(null); setError(null); }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to sign in
        </button>
      </motion.div>
    );
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
          <motion.div
            key="owner"
            className="space-y-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <form action={handleOwnerLogin} className="space-y-4">
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
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In as Owner"}
              </Button>
            </form>

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
              onClick={handleGoogleLogin}
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
              Continue with Google
            </Button>
          </motion.div>
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
