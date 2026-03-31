"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Wallet,
  PieChart,
  Target,
  TrendingUp,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Lightbulb,
  IndianRupee,
  ArrowDownUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  useMonthlyBudgetOverview,
  useCategoryQuotas,
  useUpsertCategoryQuota,
  useDeleteCategoryQuota,
  useCategorySpending,
} from "@/hooks/useBudget";
import { useUserBudget, useUpdateBudget } from "@/hooks/useExpenses";
import {
  useSavingsGoals,
  useSavingsSummary,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
} from "@/hooks/useSavings";
import {
  useInvestmentSummary,
  useCreateInvestment,
} from "@/hooks/useInvestments";
import { useMonthlyIncomeSummary } from "@/hooks/useIncome";
import { toast } from "sonner";
import type { CategoryQuota, SavingsGoal } from "@/types";

// ─── Sub-components ────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div className={`p-2.5 rounded-lg border ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-xl font-bold tracking-tight truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PlannerPage() {
  // ── Data fetching ──
  const { data: budgetOverview, isLoading: loadingOverview } =
    useMonthlyBudgetOverview();
  const { data: userBudget, isLoading: loadingBudget } = useUserBudget();
  const { data: categoryQuotas, isLoading: loadingQuotas } =
    useCategoryQuotas();
  const { data: categorySpending } = useCategorySpending();
  const { data: savingsGoals, isLoading: loadingSavings } = useSavingsGoals();
  const { data: savingsSummary } = useSavingsSummary();
  const { data: investmentSummary, isLoading: loadingInvestments } =
    useInvestmentSummary();
  const { data: incomeSummary, isLoading: loadingIncome } =
    useMonthlyIncomeSummary();

  // ── Mutations ──
  const { mutateAsync: updateBudget, isPending: updatingBudget } =
    useUpdateBudget();
  const { mutateAsync: upsertQuota, isPending: upsertingQuota } =
    useUpsertCategoryQuota();
  const { mutateAsync: deleteQuota } = useDeleteCategoryQuota();
  const { mutateAsync: createSavingsGoal, isPending: creatingSaving } =
    useCreateSavingsGoal();
  const { mutateAsync: updateSavingsGoal } = useUpdateSavingsGoal();
  const { mutateAsync: createInvestment, isPending: creatingInvestment } =
    useCreateInvestment();

  // ── Local form state ──
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [budgetEditing, setBudgetEditing] = useState(false);

  // Category quota form
  const [newQuotaCategory, setNewQuotaCategory] = useState("");
  const [newQuotaLimit, setNewQuotaLimit] = useState("");

  // Savings goal form
  const [newSavingName, setNewSavingName] = useState("");
  const [newSavingTarget, setNewSavingTarget] = useState("");
  const [newSavingCategory, setNewSavingCategory] = useState("General");

  // Investment plan form
  const [newInvestName, setNewInvestName] = useState("");
  const [newInvestType, setNewInvestType] = useState("Mutual Funds");
  const [newInvestAmount, setNewInvestAmount] = useState("");

  // Derived
  const allocatedToQuotas = useMemo(() => {
    if (!categoryQuotas) return 0;
    return categoryQuotas.reduce((s, q) => s + q.monthly_limit, 0);
  }, [categoryQuotas]);

  const currentBudget = userBudget?.monthlyBudget ?? 0;
  const unallocated = currentBudget - allocatedToQuotas;
  const allocationPct =
    currentBudget > 0
      ? Math.round((allocatedToQuotas / currentBudget) * 100)
      : 0;

  const totalIncome = incomeSummary?.totalIncome ?? 0;
  const totalSpent = budgetOverview?.totalSpent ?? 0;
  const totalSaved = savingsSummary?.totalSaved ?? 0;
  const totalInvested = investmentSummary?.totalInvested ?? 0;
  const netRemaining = totalIncome - totalSpent - totalSaved - totalInvested;

  const isLoading =
    loadingOverview ||
    loadingBudget ||
    loadingQuotas ||
    loadingSavings ||
    loadingInvestments ||
    loadingIncome;

  // ── Handlers ──
  const handleBudgetSave = async () => {
    const val = Number(monthlyBudget);
    if (!val || val <= 0) {
      toast.error("Enter a valid budget amount");
      return;
    }
    await updateBudget(val);
    setBudgetEditing(false);
    setMonthlyBudget("");
  };

  const handleAddQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Number(newQuotaLimit);
    if (!newQuotaCategory.trim() || !limit || limit <= 0) {
      toast.error("Enter a valid category and limit");
      return;
    }
    await upsertQuota({
      category: newQuotaCategory.trim(),
      monthlyLimit: limit,
    });
    setNewQuotaCategory("");
    setNewQuotaLimit("");
  };

  const handleAddSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(newSavingTarget);
    if (!newSavingName.trim() || !target || target <= 0) {
      toast.error("Enter a valid name and target");
      return;
    }
    await createSavingsGoal({
      name: newSavingName.trim(),
      target_amount: target,
      category: newSavingCategory,
      is_active: true,
    });
    setNewSavingName("");
    setNewSavingTarget("");
    setNewSavingCategory("General");
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(newInvestAmount);
    if (!newInvestName.trim() || !amount || amount <= 0) {
      toast.error("Enter a valid name and amount");
      return;
    }
    await createInvestment({
      name: newInvestName.trim(),
      type: newInvestType,
      invested_amount: amount,
      current_value: amount,
      is_active: true,
    });
    setNewInvestName("");
    setNewInvestAmount("");
    setNewInvestType("Mutual Funds");
  };

  // ── Render ──
  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10 pt-2 sm:pt-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10 pt-2 sm:pt-4">
      {/* ── Header ── */}
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          Monthly Planner
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Plan your budget, category limits, savings & investments for{" "}
          <span className="font-medium text-foreground">{currentMonth}</span>.
        </p>
      </motion.div>

      {/* ── Summary Cards ── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <SummaryCard
          icon={IndianRupee}
          label="Monthly Income"
          value={`₹${totalIncome.toLocaleString()}`}
          sub={
            incomeSummary?.bySource?.length
              ? `${incomeSummary.bySource.length} source${incomeSummary.bySource.length > 1 ? "s" : ""}`
              : "No income yet"
          }
          color="bg-green-500/10 text-green-600 border-green-500/20"
        />
        <SummaryCard
          icon={Wallet}
          label="Monthly Budget"
          value={`₹${currentBudget.toLocaleString()}`}
          sub={`₹${totalSpent.toLocaleString()} spent`}
          color="bg-primary/10 text-primary border-primary/20"
        />
        <SummaryCard
          icon={PieChart}
          label="Allocated to Categories"
          value={`₹${allocatedToQuotas.toLocaleString()}`}
          sub={`${allocationPct}% of budget`}
          color="bg-amber-500/10 text-amber-600 border-amber-500/20"
        />
        <SummaryCard
          icon={Target}
          label="Savings Goals"
          value={`₹${savingsSummary?.totalSaved.toLocaleString() ?? 0}`}
          sub={`${savingsSummary?.activeGoals ?? 0} active goals`}
          color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Invested"
          value={`₹${investmentSummary?.totalInvested.toLocaleString() ?? 0}`}
          sub={`${investmentSummary?.returnPercentage?.toFixed(1) ?? 0}% returns`}
          color="bg-violet-500/10 text-violet-600 border-violet-500/20"
        />
      </motion.div>

      {/* ── Money Flow Overview ── */}
      {totalIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-md border border-green-500/20">
                  <ArrowDownUp className="h-4 w-4 text-green-600" />
                </div>
                Where Your Money Goes
              </CardTitle>
              <CardDescription>
                A snapshot of how your income is distributed this month.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Income sources */}
              {incomeSummary?.bySource && incomeSummary.bySource.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Income Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {incomeSummary.bySource.map((s) => (
                      <Badge
                        key={s.source}
                        variant="secondary"
                        className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 gap-1.5"
                      >
                        <ArrowDownRight className="h-3 w-3" />
                        {s.source}: ₹{s.amount.toLocaleString()} ({s.percentage}
                        %)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Flow bars */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Distribution
                </p>
                {[
                  {
                    label: "Expenses",
                    amount: totalSpent,
                    color: "bg-red-500",
                    textColor: "text-red-600",
                  },
                  {
                    label: "Category Quotas",
                    amount: allocatedToQuotas,
                    color: "bg-amber-500",
                    textColor: "text-amber-600",
                  },
                  {
                    label: "Savings",
                    amount: totalSaved,
                    color: "bg-emerald-500",
                    textColor: "text-emerald-600",
                  },
                  {
                    label: "Investments",
                    amount: totalInvested,
                    color: "bg-violet-500",
                    textColor: "text-violet-600",
                  },
                ].map((item) => {
                  const pct =
                    totalIncome > 0
                      ? Math.round((item.amount / totalIncome) * 100)
                      : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <span className={`font-medium ${item.textColor}`}>
                          ₹{item.amount.toLocaleString()}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Net remaining */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight
                    className={`h-4 w-4 ${netRemaining >= 0 ? "text-green-600" : "text-destructive"}`}
                  />
                  <span className="text-sm font-medium">
                    Unaccounted Balance
                  </span>
                </div>
                <span
                  className={`text-lg font-bold ${netRemaining >= 0 ? "text-green-600" : "text-destructive"}`}
                >
                  ₹{netRemaining.toLocaleString()}
                </span>
              </div>

              {incomeSummary?.recurringIncome !== undefined &&
                incomeSummary.recurringIncome > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Recurring income: ₹
                    {incomeSummary.recurringIncome.toLocaleString()} &middot;
                    One-time: ₹{incomeSummary.oneTimeIncome.toLocaleString()}
                  </p>
                )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Quick Insight ── */}
      {unallocated !== 0 && currentBudget > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
              unallocated > 0
                ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {unallocated > 0 ? (
              <Lightbulb className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {unallocated > 0
                  ? `₹${unallocated.toLocaleString()} unallocated`
                  : `₹${Math.abs(unallocated).toLocaleString()} over-allocated`}
              </p>
              <p className="text-xs mt-0.5 opacity-80">
                {unallocated > 0
                  ? "Consider assigning remaining budget to categories or increasing savings."
                  : "Your category quotas exceed your monthly budget. Review your allocations."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── 1. Monthly Budget ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                Monthly Budget
              </CardTitle>
              <CardDescription>
                Set your overall spending limit for this month.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    ₹{currentBudget.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{budgetOverview?.totalRemaining.toLocaleString() ?? 0}{" "}
                    remaining &middot; ₹
                    {budgetOverview?.dailyBudget.toFixed(0) ?? 0}/day
                  </p>
                </div>
                {!budgetEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBudgetEditing(true);
                      setMonthlyBudget(String(currentBudget || ""));
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
              {budgetEditing && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="plan-budget" className="text-xs">
                      New Monthly Budget
                    </Label>
                    <Input
                      id="plan-budget"
                      type="number"
                      placeholder="e.g. 30000"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBudgetSave}
                    disabled={updatingBudget}
                    className="gap-1"
                  >
                    {updatingBudget ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setBudgetEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {/* Budget utilization bar */}
              {currentBudget > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent</span>
                    <span>
                      {Math.round(
                        ((budgetOverview?.totalSpent ?? 0) / currentBudget) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      ((budgetOverview?.totalSpent ?? 0) / currentBudget) * 100,
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 2. Category Quotas ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <PieChart className="h-4 w-4 text-amber-600" />
                </div>
                Category Quotas
              </CardTitle>
              <CardDescription>
                Set spending limits per expense category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget context */}
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Budget</span>
                  <span className="font-semibold">
                    ₹{currentBudget.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Allocated to Quotas
                  </span>
                  <span className="font-medium text-amber-600">
                    ₹{allocatedToQuotas.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unallocated</span>
                  <span
                    className={`font-medium ${unallocated >= 0 ? "text-emerald-600" : "text-destructive"}`}
                  >
                    ₹{unallocated.toLocaleString()}
                  </span>
                </div>
                {currentBudget > 0 && (
                  <Progress
                    value={Math.min(100, allocationPct)}
                    className="h-1.5"
                  />
                )}
              </div>

              {/* Existing quotas */}
              {categoryQuotas && categoryQuotas.length > 0 ? (
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {categoryQuotas.map((q) => {
                    const spending = categorySpending?.find(
                      (s) =>
                        s.category.toLowerCase() === q.category.toLowerCase(),
                    );
                    const spentPct = spending
                      ? Math.round(spending.percentage)
                      : 0;
                    return (
                      <div key={q.id} className="flex items-center gap-3 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant="secondary"
                              className="bg-secondary/50 text-xs"
                            >
                              {q.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ₹{spending?.spent.toLocaleString() ?? 0} / ₹
                              {q.monthly_limit.toLocaleString()}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, spentPct)}
                            className="h-1.5"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          onClick={() => deleteQuota(q.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No category quotas yet. Add one below.
                </p>
              )}

              {/* Add quota form */}
              <form onSubmit={handleAddQuota} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input
                    placeholder="e.g. Food"
                    value={newQuotaCategory}
                    onChange={(e) => setNewQuotaCategory(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">Limit (₹)</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={newQuotaLimit}
                    onChange={(e) => setNewQuotaLimit(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={upsertingQuota}
                >
                  {upsertingQuota ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Add
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 3. Savings Plan ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <Target className="h-4 w-4 text-emerald-600" />
                </div>
                Savings Goals
              </CardTitle>
              <CardDescription>
                Track and plan your savings targets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsGoals && savingsGoals.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {savingsGoals
                    .filter((g) => g.is_active)
                    .map((goal) => {
                      const pct =
                        goal.target_amount > 0
                          ? Math.round(
                              (goal.saved_amount / goal.target_amount) * 100,
                            )
                          : 0;
                      return (
                        <div key={goal.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {goal.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {goal.category}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, pct)}
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground">
                            ₹{goal.saved_amount.toLocaleString()} / ₹
                            {goal.target_amount.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active savings goals. Create one below.
                </p>
              )}

              {/* Add savings goal form */}
              <form
                onSubmit={handleAddSaving}
                className="space-y-2 border-t border-border/50 pt-3"
              >
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Goal Name</Label>
                    <Input
                      placeholder="e.g. Emergency Fund"
                      value={newSavingName}
                      onChange={(e) => setNewSavingName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Target (₹)</Label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={newSavingTarget}
                      onChange={(e) => setNewSavingTarget(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Category</Label>
                    <select
                      value={newSavingCategory}
                      onChange={(e) => setNewSavingCategory(e.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="General">General</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Retirement">Retirement</option>
                      <option value="Goal-Based">Goal-Based</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={creatingSaving}
                  >
                    {creatingSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add Goal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── 4. Investment Plan ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="border-border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-violet-500/10 rounded-md border border-violet-500/20">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                Investments
              </CardTitle>
              <CardDescription>
                Plan new investments or view your portfolio summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portfolio summary */}
              {investmentSummary &&
              investmentSummary.byType &&
              investmentSummary.byType.length > 0 ? (
                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                  {investmentSummary.byType.map((t) => (
                    <div
                      key={t.type}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{t.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-foreground">
                          ₹{t.currentValue.toLocaleString()}
                        </span>
                        <span
                          className={`ml-2 text-xs ${
                            t.returns >= 0
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {t.returns >= 0 ? "+" : ""}₹
                          {t.returns.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No investments yet. Plan your first one below.
                </p>
              )}

              {/* Add investment form */}
              <form
                onSubmit={handleAddInvestment}
                className="space-y-2 border-t border-border/50 pt-3"
              >
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Investment Name</Label>
                    <Input
                      placeholder="e.g. Nifty 50 SIP"
                      value={newInvestName}
                      onChange={(e) => setNewInvestName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={newInvestAmount}
                      onChange={(e) => setNewInvestAmount(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={newInvestType}
                      onChange={(e) => setNewInvestType(e.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      <option value="Stocks">Stocks</option>
                      <option value="Mutual Funds">Mutual Funds</option>
                      <option value="FD">FD</option>
                      <option value="PPF">PPF</option>
                      <option value="Gold">Gold</option>
                      <option value="Crypto">Crypto</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={creatingInvestment}
                  >
                    {creatingInvestment ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Add
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Planning Tips ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Quick Planning Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                <p className="font-medium">50/30/20 Rule</p>
                <p className="text-xs text-muted-foreground">
                  Allocate 50% to needs, 30% to wants, and 20% to savings &
                  investments.
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                <p className="font-medium">Emergency Fund</p>
                <p className="text-xs text-muted-foreground">
                  Aim for 3-6 months of expenses saved before aggressive
                  investing.
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1">
                <p className="font-medium">Review Weekly</p>
                <p className="text-xs text-muted-foreground">
                  Check your category spending each week to stay on track with
                  your plan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
