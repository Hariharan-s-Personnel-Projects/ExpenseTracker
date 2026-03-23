"use client";

import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
  PieChart,
  ArrowRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  useMonthlyBudgetOverview,
  useSetWeeklyOverride,
  useRemoveWeeklyOverride,
  useCategoryQuotas,
  useUpsertCategoryQuota,
  useDeleteCategoryQuota,
  useCategorySpending,
} from "@/hooks/useBudget";
import { useUserBudget, useUpdateBudget } from "@/hooks/useExpenses";
import { toast } from "sonner";
import { WeekBreakdown } from "@/types";

// ────────────────────────────────────────────────────────────────────────────
// Weekly Row with inline edit
// ────────────────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  onSaveOverride,
  onRemoveOverride,
  isSaving,
}: {
  week: WeekBreakdown;
  onSaveOverride: (weekStart: string, weekEnd: string, amount: number) => void;
  onRemoveOverride: (weekStart: string) => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function startEdit() {
    setEditValue(String(Math.round(week.effectiveBudget)));
    setEditing(true);
  }

  function saveEdit() {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    onSaveOverride(week.weekStart, week.weekEnd, val);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  const isOverspent = week.spent > week.effectiveBudget;
  const pct =
    week.effectiveBudget > 0
      ? Math.min((week.spent / week.effectiveBudget) * 100, 100)
      : 0;

  return (
    <TableRow
      className={`border-border/50 transition-colors ${week.isCurrentWeek ? "bg-primary/5" : "hover:bg-muted/30"}`}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>Week {week.weekNumber}</span>
          {week.isCurrentWeek && (
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary text-xs"
            >
              Current
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(parseISO(week.weekStart), "MMM d")} –{" "}
          {format(parseISO(week.weekEnd), "MMM d")}
        </p>
      </TableCell>
      <TableCell className="text-center text-muted-foreground text-sm">
        {week.daysInWeek}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        ₹{Math.round(week.baseBudget).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <Input
              type="number"
              min={0}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-24 h-8 text-sm text-right"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={saveEdit}
              disabled={isSaving}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={cancelEdit}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <span className="font-medium">
              ₹{Math.round(week.effectiveBudget).toLocaleString()}
            </span>
            {week.overrideBudget !== null && (
              <Badge variant="outline" className="text-[10px] ml-1">
                Custom
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 ml-1"
              onClick={startEdit}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            {week.overrideBudget !== null && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemoveOverride(week.weekStart)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right font-medium">
        ₹{Math.round(week.spent).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={`font-medium ${isOverspent ? "text-destructive" : "text-emerald-500"}`}
        >
          ₹{Math.round(week.remaining).toLocaleString()}
        </span>
      </TableCell>
      <TableCell>
        <Progress
          value={pct}
          className={`h-1.5 w-20 ${isOverspent ? "[&>div]:bg-destructive" : ""}`}
        />
      </TableCell>
    </TableRow>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Category Quota Manager
// ────────────────────────────────────────────────────────────────────────────

function CategoryQuotaSection() {
  const { data: quotas, isLoading: quotasLoading } = useCategoryQuotas();
  const { data: spending, isLoading: spendingLoading } = useCategorySpending();
  const { mutate: upsertQuota, isPending: upsertPending } =
    useUpsertCategoryQuota();
  const { mutate: deleteQuota } = useDeleteCategoryQuota();

  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  function handleAddQuota() {
    const cat = newCategory.trim();
    const limit = parseFloat(newLimit);
    if (!cat) {
      toast.error("Enter a category name");
      return;
    }
    if (isNaN(limit) || limit <= 0) {
      toast.error("Enter a valid monthly limit");
      return;
    }
    upsertQuota(
      { category: cat, monthlyLimit: limit },
      {
        onSuccess: () => {
          setNewCategory("");
          setNewLimit("");
          setShowAdd(false);
        },
      },
    );
  }

  const isLoading = quotasLoading || spendingLoading;

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                <PieChart className="h-4 w-4 text-primary" />
              </div>
              Category Quotas
            </CardTitle>
            <CardDescription className="mt-1.5">
              Set monthly limits per category to control spending.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border/50 bg-muted/20"
          >
            <Input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Monthly limit (₹)"
              type="number"
              min={0}
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-40"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={handleAddQuota}
                disabled={upsertPending}
                className="gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !quotas?.length ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No category quotas set. Add one to start tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {quotas.map((q) => {
              const sp = spending?.find((s) => s.category === q.category);
              const spent = sp?.spent ?? 0;
              const limit = Number(q.monthly_limit);
              const remaining = limit - spent;
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const isOver = spent > limit;

              return (
                <div
                  key={q.id}
                  className="p-3 rounded-lg border border-border/50 bg-card/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-secondary/50 text-xs"
                      >
                        {q.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ₹{Math.round(spent).toLocaleString()} / ₹
                        {Math.round(limit).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm font-medium ${isOver ? "text-destructive" : "text-emerald-500"}`}
                      >
                        ₹{Math.round(remaining).toLocaleString()}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={() => deleteQuota(q.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={pct}
                    className={`h-1.5 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 text-right">
                    {pct.toFixed(1)}% used
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Budget & Quotas Page
// ────────────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { data: budgetData, isLoading: budgetLoading } = useUserBudget();
  const { mutate: updateBudget, isPending: budgetPending } = useUpdateBudget();
  const [monthlyInput, setMonthlyInput] = useState("");
  const [monthlyEditing, setMonthlyEditing] = useState(false);

  const { data: overview, isLoading: overviewLoading } =
    useMonthlyBudgetOverview();
  const { mutate: setOverride, isPending: overridePending } =
    useSetWeeklyOverride();
  const { mutate: removeOverride } = useRemoveWeeklyOverride();

  function handleSaveMonthly() {
    const val = parseFloat(monthlyInput);
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid monthly budget");
      return;
    }
    updateBudget(val, {
      onSuccess: () => setMonthlyEditing(false),
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Budget & Quotas
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your monthly budget, weekly allocation, and category limits.
        </p>
      </motion.div>

      {/* Monthly Budget Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              Monthly Budget
            </CardTitle>
            <CardDescription>
              Your total budget for the month. This is auto-distributed across
              weeks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetLoading ? (
              <Skeleton className="h-12 w-48" />
            ) : monthlyEditing ? (
              <div className="flex items-center gap-2">
                <Label className="sr-only">Monthly Budget</Label>
                <Input
                  type="number"
                  min={0}
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(e.target.value)}
                  className="w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveMonthly();
                    if (e.key === "Escape") setMonthlyEditing(false);
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveMonthly}
                  disabled={budgetPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMonthlyEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold tracking-tight">
                  ₹
                  {(budgetData?.monthlyBudget ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setMonthlyInput(String(budgetData?.monthlyBudget ?? 0));
                    setMonthlyEditing(true);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            )}

            {/* Carry-forward summary */}
            {overview && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Spent
                  </p>
                  <p className="text-lg font-semibold">
                    ₹{overview.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Remaining
                  </p>
                  <p
                    className={`text-lg font-semibold ${overview.totalRemaining < 0 ? "text-destructive" : "text-emerald-500"}`}
                  >
                    ₹{overview.totalRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Daily Budget
                  </p>
                  <p className="text-lg font-semibold">
                    ₹{overview.dailyBudget.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current Week
                  </p>
                  <p className="text-lg font-semibold">
                    {overview.currentWeekIndex >= 0
                      ? `Week ${overview.currentWeekIndex + 1}`
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Breakdown Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              Weekly Budget Breakdown
            </CardTitle>
            <CardDescription>
              Budget is proportionally split by days per week. Click edit to
              override any week. Carry-forward is automatically applied.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {overviewLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !overview?.weeks?.length ? (
              <p className="text-center py-8 text-muted-foreground text-sm">
                Set a monthly budget to see the weekly breakdown.
              </p>
            ) : (
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Week</TableHead>
                    <TableHead className="text-center">Days</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.weeks.map((w) => (
                    <WeekRow
                      key={w.weekNumber}
                      week={w}
                      onSaveOverride={(ws, we, amt) =>
                        setOverride({
                          weekStart: ws,
                          weekEnd: we,
                          amount: amt,
                        })
                      }
                      onRemoveOverride={(ws) => removeOverride(ws)}
                      isSaving={overridePending}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {overview && overview.weeks.length > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-border/50 bg-muted/10 flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-primary" />
                <span>
                  Carry-forward: Under-spending redistributes remaining budget
                  across future days. Over-spending reduces future weekly
                  budgets.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Quotas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <CategoryQuotaSection />
      </motion.div>
    </div>
  );
}
