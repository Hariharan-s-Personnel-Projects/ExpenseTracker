"use client";

import { useState, useMemo, useEffect, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Send,
  Loader2,
  Wallet,
  PiggyBank,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Search,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import {
  submitMonthlyPlan,
  type PlannerIncomeRow,
  type PlannerBudgetRow,
  type PlannerSavingsRow,
  type PlannerInvestmentRow,
} from "@/actions/planner";
import { format, addMonths, subMonths } from "date-fns";
import { useCategoryQuotas, useCategorySpending } from "@/hooks/useBudget";
import { useExpenses, useUserBudget } from "@/hooks/useExpenses";
import { useIncomes } from "@/hooks/useIncome";
import { useSavingsGoals } from "@/hooks/useSavings";
import { useInvestments } from "@/hooks/useInvestments";
import { createPortal } from "react-dom";
import type { IncomeSource, SavingsCategory, InvestmentType } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────

const INCOME_SOURCES: IncomeSource[] = [
  "Salary",
  "Freelance",
  "Side Hustle",
  "Rental",
  "Dividends",
  "Interest",
  "Business",
  "Gift",
  "Other",
];

const DEFAULT_EXPENSE_CATEGORIES = ["Daily Expense"];

const SAVINGS_CATEGORIES: SavingsCategory[] = [
  "General",
  "Emergency",
  "Retirement",
  "Goal-Based",
];

const INVESTMENT_TYPES: InvestmentType[] = [
  "Stocks",
  "Mutual Funds",
  "FD",
  "PPF",
  "Gold",
  "Crypto",
  "Real Estate",
  "Other",
];

// ─── Empty row factories ───────────────────────────────────────────────────

const emptyIncome = (): PlannerIncomeRow => ({
  source: "",
  amount: 0,
  is_recurring: true,
  notes: "",
});

const emptyBudget = (): PlannerBudgetRow => ({
  category: "",
  monthly_limit: 0,
});

const emptySavings = (): PlannerSavingsRow => ({
  name: "",
  target_amount: 0,
  category: "General",
});

const emptyInvestment = (): PlannerInvestmentRow => ({
  name: "",
  type: "Mutual Funds",
  amount: 0,
  notes: "",
});

// ─── Animations ────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Cell component for inline editing ─────────────────────────────────────

function Cell({
  value,
  onChange,
  type = "text",
  placeholder,
  className = "",
  min,
  onKeyDown,
}: {
  value: string | number;
  onChange: (val: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
  min?: number;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      min={min}
      className={`w-full bg-transparent border-0 border-b border-transparent focus:border-primary/40 outline-none px-2 py-1.5 text-sm transition-colors placeholder:text-muted-foreground/40 ${className}`}
    />
  );
}

function SelectCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <Select
      value={value}
      options={options}
      onChange={onChange}
      placeholder="Select..."
      className="h-8 border-0 border-b border-transparent rounded-none focus-visible:border-primary/40 focus-visible:ring-0 shadow-none text-sm"
    />
  );
}

function SearchableSelectCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const canCreate =
    search.trim().length > 0 &&
    !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  // Position dropdown relative to trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 224),
    });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setSearch("");
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full text-left bg-transparent border-0 border-b border-transparent focus:border-primary/40 outline-none px-2 py-1.5 text-sm transition-colors cursor-pointer truncate"
      >
        {value || <span className="text-muted-foreground/40">Select...</span>}
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/40">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (canCreate) {
                      select(search.trim());
                    } else if (filtered.length === 1) {
                      select(filtered[0]);
                    }
                  }
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearch("");
                  }
                }}
                placeholder="Search or create..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => select(opt)}
                  className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors ${
                    value === opt
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent/50"
                  }`}
                >
                  {opt}
                </button>
              ))}

              {filtered.length === 0 && !canCreate && (
                <p className="px-2.5 py-2 text-xs text-muted-foreground">
                  No categories found
                </p>
              )}

              {/* Create new option */}
              {canCreate && (
                <button
                  type="button"
                  onClick={() => select(search.trim())}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md text-primary hover:bg-primary/10 transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Create &ldquo;{search.trim()}&rdquo;
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Format currency ───────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const [targetMonth, setTargetMonth] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [incomes, setIncomes] = useState<PlannerIncomeRow[]>([emptyIncome()]);
  const [budgets, setBudgets] = useState<PlannerBudgetRow[]>([emptyBudget()]);
  const [savings, setSavings] = useState<PlannerSavingsRow[]>([emptySavings()]);
  const [investments, setInvestments] = useState<PlannerInvestmentRow[]>([
    emptyInvestment(),
  ]);
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch existing user data ─────────────────────────────────────────

  const { data: categoryQuotas, isLoading: loadingQuotas } =
    useCategoryQuotas();
  const { data: expenses, isLoading: loadingExpenses } = useExpenses();
  const { data: userBudget, isLoading: loadingBudget } = useUserBudget();
  const { data: existingIncomes, isLoading: loadingIncomes } = useIncomes();
  const { data: existingSavings, isLoading: loadingSavings } =
    useSavingsGoals();
  const { data: existingInvestments, isLoading: loadingInvestments } =
    useInvestments();

  const isLoading =
    loadingQuotas ||
    loadingExpenses ||
    loadingBudget ||
    loadingIncomes ||
    loadingSavings ||
    loadingInvestments;

  // Track whether we've already seeded from existing data
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;

    const hasData =
      userBudget !== undefined &&
      categoryQuotas !== undefined &&
      existingIncomes !== undefined &&
      existingSavings !== undefined &&
      existingInvestments !== undefined;

    if (!hasData) return;
    seeded.current = true;

    // Pre-fill monthly budget
    if (userBudget.monthlyBudget > 0) {
      setMonthlyBudget(userBudget.monthlyBudget);
    }

    // Pre-fill incomes — recurring first, then recent one-time entries
    const recurring = existingIncomes.filter((i) => i.is_recurring);
    // Deduplicate one-time incomes by source (keep the latest/biggest)
    const oneTimeBySource = new Map<
      string,
      { id: string; source: string; amount: number; notes: string }
    >();
    existingIncomes
      .filter((i) => !i.is_recurring)
      .forEach((i) => {
        const key = i.source.toLowerCase();
        const existing = oneTimeBySource.get(key);
        if (!existing || Number(i.amount) > existing.amount) {
          oneTimeBySource.set(key, {
            id: i.id,
            source: i.source,
            amount: Number(i.amount),
            notes: i.notes || "",
          });
        }
      });

    const incomeRows: PlannerIncomeRow[] = [
      ...recurring.map((i) => ({
        id: i.id,
        source: i.source,
        amount: Number(i.amount),
        is_recurring: true,
        notes: i.notes || "",
      })),
      ...Array.from(oneTimeBySource.values()).map((i) => ({
        id: i.id,
        source: i.source,
        amount: i.amount,
        is_recurring: false,
        notes: i.notes,
      })),
    ];
    if (incomeRows.length > 0) {
      setIncomes([...incomeRows, emptyIncome()]);
    }

    // Pre-fill category budgets — start with "Daily Expense" from monthly budget,
    // then add existing quotas
    const budgetRows: PlannerBudgetRow[] = [];
    if (userBudget.monthlyBudget > 0) {
      budgetRows.push({
        category: "Daily Expense",
        monthly_limit: userBudget.monthlyBudget,
      });
    }
    if (categoryQuotas.length > 0) {
      for (const q of categoryQuotas) {
        // Skip if it's a duplicate "Daily Expense"
        if (
          q.category.toLowerCase() === "daily expense" &&
          budgetRows.length > 0
        )
          continue;
        budgetRows.push({
          id: q.id,
          category: q.category,
          monthly_limit: q.monthly_limit,
        });
      }
    }
    if (budgetRows.length > 0) {
      setBudgets([...budgetRows, emptyBudget()]);
    }

    // Pre-fill savings from active goals
    const activeGoals = existingSavings.filter((g) => g.is_active);
    if (activeGoals.length > 0) {
      setSavings([
        ...activeGoals.map((g) => ({
          id: g.id,
          name: g.name,
          target_amount: Number(g.target_amount),
          category: g.category || "General",
        })),
        emptySavings(),
      ]);
    }

    // Pre-fill investments from active investments
    const activeInvestments = existingInvestments.filter((i) => i.is_active);
    if (activeInvestments.length > 0) {
      setInvestments([
        ...activeInvestments.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type || "Other",
          amount: Number(i.invested_amount),
          notes: i.notes || "",
        })),
        emptyInvestment(),
      ]);
    }
  }, [
    userBudget,
    categoryQuotas,
    existingIncomes,
    existingSavings,
    existingInvestments,
  ]);

  // Merge defaults + user's existing quota categories + past expense categories
  const expenseCategories = useMemo(() => {
    const seen = new Map<string, string>();
    // Add defaults first
    for (const c of DEFAULT_EXPENSE_CATEGORIES) {
      seen.set(c.toLowerCase(), c);
    }
    // Add categories from existing budget quotas
    if (categoryQuotas) {
      for (const q of categoryQuotas) {
        const key = q.category.toLowerCase();
        if (!seen.has(key)) seen.set(key, q.category);
      }
    }
    // Add categories from past expenses
    if (expenses) {
      for (const e of expenses) {
        if (e.major_category === "Daily Expense") continue;
        const key = e.major_category.toLowerCase();
        if (!seen.has(key)) seen.set(key, e.major_category);
      }
    }
    return Array.from(seen.values());
  }, [categoryQuotas, expenses]);

  // ─── Month navigation ─────────────────────────────────────────────────

  const currentMonthDate = new Date(
    parseInt(targetMonth.split("-")[0]),
    parseInt(targetMonth.split("-")[1]) - 1,
  );

  const prevMonth = () =>
    setTargetMonth(format(subMonths(currentMonthDate, 1), "yyyy-MM"));
  const nextMonth = () =>
    setTargetMonth(format(addMonths(currentMonthDate, 1), "yyyy-MM"));

  // ─── Summaries ────────────────────────────────────────────────────────

  const totalIncome = incomes.reduce((s, r) => s + (r.amount || 0), 0);
  const totalBudgeted = budgets.reduce((s, r) => s + (r.monthly_limit || 0), 0);
  const totalSavings = savings.reduce((s, r) => s + (r.target_amount || 0), 0);
  const totalInvestments = investments.reduce((s, r) => s + (r.amount || 0), 0);
  const totalAllocated = totalBudgeted + totalSavings + totalInvestments;
  const unallocated = totalIncome - totalAllocated;

  // ─── Row operations (generic) ─────────────────────────────────────────

  function updateRow<T>(
    arr: T[],
    setArr: (a: T[]) => void,
    index: number,
    field: keyof T,
    value: T[keyof T],
  ) {
    const updated = [...arr];
    updated[index] = { ...updated[index], [field]: value };
    setArr(updated);
  }

  function addRow<T>(arr: T[], setArr: (a: T[]) => void, factory: () => T) {
    setArr([...arr, factory()]);
  }

  function removeRow<T>(arr: T[], setArr: (a: T[]) => void, index: number) {
    if (arr.length <= 1) return;
    setArr(arr.filter((_, i) => i !== index));
  }

  // ─── Tab through cells: Enter to add row at end ──────────────────────

  function handleCellKeyDown<T>(
    e: KeyboardEvent<HTMLInputElement>,
    arr: T[],
    setArr: (a: T[]) => void,
    factory: () => T,
    rowIndex: number,
    isLastCol: boolean,
  ) {
    if (e.key === "Enter" && isLastCol && rowIndex === arr.length - 1) {
      e.preventDefault();
      addRow(arr, setArr, factory);
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (
      totalIncome === 0 &&
      totalBudgeted === 0 &&
      totalSavings === 0 &&
      totalInvestments === 0
    ) {
      toast.error("Add at least one item to your plan before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitMonthlyPlan({
        month: targetMonth,
        monthlyBudget,
        incomes,
        budgets,
        savings,
        investments,
      });

      if (result.success) {
        toast.success("Plan submitted! All data has been created.");
      } else {
        result.errors.forEach((err) => toast.error(err));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit plan");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  if (isLoading) {
    return <PlannerSkeleton />;
  }

  return (
    <motion.div
      className="space-y-6 pb-10"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Header */}
      <motion.div className="flex flex-col gap-1" variants={fadeUp}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Monthly Planner
        </h1>
        <p className="text-sm text-muted-foreground">
          Plan your month ahead &mdash; income, budgets, savings &amp;
          investments in one spreadsheet.
        </p>
      </motion.div>

      {/* Month Selector + Overall Budget */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
              {/* Month nav */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-lg font-semibold min-w-[140px] text-center">
                  {format(currentMonthDate, "MMMM yyyy")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Monthly daily-expense budget */}
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Daily Expense Budget:
                </label>
                <div className="relative max-w-[180px]">
                  <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    value={monthlyBudget || ""}
                    onChange={(e) => {
                      const val = Math.round(parseFloat(e.target.value) || 0);
                      setMonthlyBudget(val);
                      // Sync the Daily Expense row in budgets table
                      const deIdx = budgets.findIndex(
                        (b) => b.category.toLowerCase() === "daily expense",
                      );
                      if (deIdx !== -1) {
                        const updated = [...budgets];
                        updated[deIdx] = {
                          ...updated[deIdx],
                          monthly_limit: val,
                        };
                        setBudgets(updated);
                      }
                    }}
                    placeholder="0"
                    className="pl-7 h-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Bar */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryTile
            label="Total Income"
            value={totalIncome}
            icon={Wallet}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-500/10"
          />
          <SummaryTile
            label="Budgeted"
            value={totalBudgeted}
            icon={Receipt}
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-500/10"
          />
          <SummaryTile
            label="Savings"
            value={totalSavings}
            icon={PiggyBank}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <SummaryTile
            label="Investments"
            value={totalInvestments}
            icon={TrendingUp}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <SummaryTile
            label="Unallocated"
            value={unallocated}
            icon={unallocated >= 0 ? CheckCircle2 : AlertCircle}
            color={
              unallocated >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }
            bg={unallocated >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}
          />
        </div>
      </motion.div>

      {/* ─── Income Section ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <SpreadsheetSection
          title="Income"
          description="List all expected income sources for this month"
          icon={Wallet}
          color="text-green-600 dark:text-green-400"
          total={totalIncome}
          totalLabel="Total Income"
        >
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_60px_1fr_36px] sm:grid-cols-[1.2fr_140px_70px_1.5fr_36px] gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-t-lg">
            <span>Source</span>
            <span>Amount</span>
            <span className="text-center">Recurring</span>
            <span>Notes</span>
            <span />
          </div>
          {/* Rows */}
          {incomes.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_60px_1fr_36px] sm:grid-cols-[1.2fr_140px_70px_1.5fr_36px] gap-1 px-3 items-center border-b border-border/30 hover:bg-muted/20 transition-colors"
            >
              <SelectCell
                value={row.source}
                options={INCOME_SOURCES}
                onChange={(v) => updateRow(incomes, setIncomes, i, "source", v)}
              />
              <Cell
                type="number"
                value={row.amount}
                min={0}
                placeholder="0"
                onChange={(v) =>
                  updateRow(
                    incomes,
                    setIncomes,
                    i,
                    "amount",
                    Math.round(parseFloat(v) || 0),
                  )
                }
              />
              <div className="flex justify-center">
                <Checkbox
                  checked={row.is_recurring}
                  onCheckedChange={(c) =>
                    updateRow(incomes, setIncomes, i, "is_recurring", !!c)
                  }
                />
              </div>
              <Cell
                value={row.notes}
                placeholder="Optional notes..."
                onChange={(v) => updateRow(incomes, setIncomes, i, "notes", v)}
                onKeyDown={(e) =>
                  handleCellKeyDown(
                    e,
                    incomes,
                    setIncomes,
                    emptyIncome,
                    i,
                    true,
                  )
                }
              />
              <button
                onClick={() => removeRow(incomes, setIncomes, i)}
                className="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                disabled={incomes.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {/* Add row */}
          <AddRowButton
            onClick={() => addRow(incomes, setIncomes, emptyIncome)}
          />
        </SpreadsheetSection>
      </motion.div>

      {/* ─── Category Budgets Section ───────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <SpreadsheetSection
          title="Category Budgets"
          description="Set monthly spending limits per category (these become category quotas)"
          icon={Receipt}
          color="text-orange-600 dark:text-orange-400"
          total={totalBudgeted}
          totalLabel="Total Budgeted"
        >
          <div className="grid grid-cols-[1fr_140px_36px] sm:grid-cols-[1.5fr_180px_36px] gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-t-lg">
            <span>Category</span>
            <span>Monthly Limit</span>
            <span />
          </div>
          {budgets.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_140px_36px] sm:grid-cols-[1.5fr_180px_36px] gap-1 px-3 items-center border-b border-border/30 hover:bg-muted/20 transition-colors"
            >
              <SearchableSelectCell
                value={row.category}
                options={expenseCategories}
                onChange={(v) =>
                  updateRow(budgets, setBudgets, i, "category", v)
                }
              />
              <Cell
                type="number"
                value={row.monthly_limit}
                min={0}
                placeholder="0"
                onChange={(v) => {
                  const val = Math.round(parseFloat(v) || 0);
                  updateRow(budgets, setBudgets, i, "monthly_limit", val);
                  // Sync Daily Expense row back to the top-level budget field
                  if (row.category.toLowerCase() === "daily expense") {
                    setMonthlyBudget(val);
                  }
                }}
                onKeyDown={(e) =>
                  handleCellKeyDown(
                    e,
                    budgets,
                    setBudgets,
                    emptyBudget,
                    i,
                    true,
                  )
                }
              />
              <button
                onClick={() => removeRow(budgets, setBudgets, i)}
                className="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                disabled={budgets.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <AddRowButton
            onClick={() => addRow(budgets, setBudgets, emptyBudget)}
          />
        </SpreadsheetSection>
      </motion.div>

      {/* ─── Savings Goals Section ──────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <SpreadsheetSection
          title="Savings Goals"
          description="Plan savings goals you want to start or fund this month"
          icon={PiggyBank}
          color="text-blue-600 dark:text-blue-400"
          total={totalSavings}
          totalLabel="Total Savings Target"
        >
          <div className="grid grid-cols-[1fr_140px_120px_36px] sm:grid-cols-[1.5fr_160px_150px_36px] gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-t-lg">
            <span>Goal Name</span>
            <span>Target Amount</span>
            <span>Category</span>
            <span />
          </div>
          {savings.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_140px_120px_36px] sm:grid-cols-[1.5fr_160px_150px_36px] gap-1 px-3 items-center border-b border-border/30 hover:bg-muted/20 transition-colors"
            >
              <Cell
                value={row.name}
                placeholder="e.g. Emergency Fund"
                onChange={(v) => updateRow(savings, setSavings, i, "name", v)}
              />
              <Cell
                type="number"
                value={row.target_amount}
                min={0}
                placeholder="0"
                onChange={(v) =>
                  updateRow(
                    savings,
                    setSavings,
                    i,
                    "target_amount",
                    Math.round(parseFloat(v) || 0),
                  )
                }
              />
              <SelectCell
                value={row.category}
                options={SAVINGS_CATEGORIES}
                onChange={(v) =>
                  updateRow(savings, setSavings, i, "category", v)
                }
              />
              <button
                onClick={() => removeRow(savings, setSavings, i)}
                className="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                disabled={savings.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <AddRowButton
            onClick={() => addRow(savings, setSavings, emptySavings)}
          />
        </SpreadsheetSection>
      </motion.div>

      {/* ─── Investments Section ────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <SpreadsheetSection
          title="Investments"
          description="Plan investments for this month - SIPs, stocks, FDs, etc."
          icon={TrendingUp}
          color="text-purple-600 dark:text-purple-400"
          total={totalInvestments}
          totalLabel="Total Investments"
        >
          <div className="grid grid-cols-[1fr_120px_120px_1fr_36px] sm:grid-cols-[1.2fr_140px_140px_1.5fr_36px] gap-1 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-t-lg">
            <span>Name</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Notes</span>
            <span />
          </div>
          {investments.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_120px_120px_1fr_36px] sm:grid-cols-[1.2fr_140px_140px_1.5fr_36px] gap-1 px-3 items-center border-b border-border/30 hover:bg-muted/20 transition-colors"
            >
              <Cell
                value={row.name}
                placeholder="e.g. Nifty 50 SIP"
                onChange={(v) =>
                  updateRow(investments, setInvestments, i, "name", v)
                }
              />
              <SelectCell
                value={row.type}
                options={INVESTMENT_TYPES}
                onChange={(v) =>
                  updateRow(investments, setInvestments, i, "type", v)
                }
              />
              <Cell
                type="number"
                value={row.amount}
                min={0}
                placeholder="0"
                onChange={(v) =>
                  updateRow(
                    investments,
                    setInvestments,
                    i,
                    "amount",
                    Math.round(parseFloat(v) || 0),
                  )
                }
              />
              <Cell
                value={row.notes}
                placeholder="Optional notes..."
                onChange={(v) =>
                  updateRow(investments, setInvestments, i, "notes", v)
                }
                onKeyDown={(e) =>
                  handleCellKeyDown(
                    e,
                    investments,
                    setInvestments,
                    emptyInvestment,
                    i,
                    true,
                  )
                }
              />
              <button
                onClick={() => removeRow(investments, setInvestments, i)}
                className="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                disabled={investments.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <AddRowButton
            onClick={() => addRow(investments, setInvestments, emptyInvestment)}
          />
        </SpreadsheetSection>
      </motion.div>

      {/* ─── Allocation Breakdown ───────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Allocation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AllocationBar
                label="Category Budgets"
                amount={totalBudgeted}
                total={totalIncome}
                color="bg-orange-500"
              />
              <AllocationBar
                label="Savings"
                amount={totalSavings}
                total={totalIncome}
                color="bg-blue-500"
              />
              <AllocationBar
                label="Investments"
                amount={totalInvestments}
                total={totalIncome}
                color="bg-purple-500"
              />
              <AllocationBar
                label="Unallocated"
                amount={Math.max(unallocated, 0)}
                total={totalIncome}
                color="bg-emerald-500"
              />
              {unallocated < 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Over-allocated by{" "}
                    <strong>{formatCurrency(Math.abs(unallocated))}</strong>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Submit ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2 px-8"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {submitting ? "Submitting Plan..." : "Submit Plan"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SummaryTile({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${bg} flex flex-col gap-1`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <span className={`text-lg sm:text-xl font-bold ${color}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function SpreadsheetSection({
  title,
  description,
  icon: Icon,
  color,
  total,
  totalLabel,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  total: number;
  totalLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-sm">
            {totalLabel}: {formatCurrency(total)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-4 sm:pb-4">
        <div className="border rounded-lg mx-3 sm:mx-0 mb-3 sm:mb-0">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function AddRowButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-b-lg"
    >
      <Plus className="h-3.5 w-3.5" />
      Add row
    </button>
  );
}

function AllocationBar({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {formatCurrency(amount)}{" "}
          <span className="text-muted-foreground text-xs">
            ({Math.round(pct)}%)
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton Loading UI ───────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 3 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid gap-1 px-3 py-2.5 border-b border-border/30"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-5 w-full rounded" />
          ))}
        </div>
      ))}
    </>
  );
}

function SkeletonSection() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:px-4 sm:pb-4">
        <div className="border rounded-lg mx-3 sm:mx-0 mb-3 sm:mb-0">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-muted/50 rounded-t-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16 rounded" />
            ))}
          </div>
          <SkeletonRows cols={4} rows={3} />
        </div>
      </CardContent>
    </Card>
  );
}

function PlannerSkeleton() {
  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52 rounded" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Month selector + budget */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-6 w-36 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-9 w-[180px] rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-3 sm:p-4 bg-muted/30 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* 4 spreadsheet sections */}
      <SkeletonSection />
      <SkeletonSection />
      <SkeletonSection />
      <SkeletonSection />

      {/* Allocation breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40 rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  );
}
