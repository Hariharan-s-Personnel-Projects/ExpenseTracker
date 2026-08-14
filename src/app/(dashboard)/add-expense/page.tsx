"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle,
  Loader2,
  ChevronDown,
  Check,
  Smartphone,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateExpense, useExpenses } from "@/hooks/useExpenses";
import { useCategoryQuotas } from "@/hooks/useBudget";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import BulkExpenseTab from "./BulkExpenseTab";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  major_category: z.string().min(2, "Major category is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Date is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;
type TabId = "single" | "bulk";

// Fade + subtle vertical lift — no horizontal overflow, works at any container width
const tabContentVariants = {
  enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 10 : -10 }),
  center: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -6 : 6,
    transition: {
      duration: 0.16,
      ease: [0.55, 0, 1, 0.45] as [number, number, number, number],
    },
  }),
};

export default function AddExpensePage() {
  const router = useRouter();
  const { mutateAsync: createExpense, isPending } = useCreateExpense();
  const { data: expenses } = useExpenses();
  const { data: categoryQuotas } = useCategoryQuotas();

  const [activeTab, setActiveTab] = useState<TabId>("single");
  const [direction, setDirection] = useState(1);

  const switchTab = (next: TabId) => {
    if (next === activeTab) return;
    setDirection(next === "bulk" ? 1 : -1);
    setActiveTab(next);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ExpenseFormValues>({
    // @ts-ignore: Next.js build strictness mismatch between Zod's coerce and useForm
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      major_category: "Daily Expense",
      category: "",
      description: "",
      expense_date: new Date().toISOString().split("T")[0],
    },
  });

  const majorCategoryValue = watch("major_category");
  const categoryValue = watch("category");
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [payWithApp, setPayWithApp] = useState(true);

  const isDailyExpense = majorCategoryValue === "Daily Expense";

  useEffect(() => {
    if (!isDailyExpense && majorCategoryValue) {
      setValue("category", majorCategoryValue, { shouldValidate: true });
    } else if (isDailyExpense && categoryValue === majorCategoryValue) {
      setValue("category", "", { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [majorCategoryValue]);

  const majorDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const majorCategoryOptions = useMemo(() => {
    const options = new Map<string, string>();
    options.set("daily expense", "Daily Expense");
    if (categoryQuotas) {
      for (const q of categoryQuotas) {
        const lower = q.category.toLowerCase();
        if (!options.has(lower)) options.set(lower, q.category);
      }
    }
    return Array.from(options.values());
  }, [categoryQuotas]);

  const subCategoryOptions = useMemo(() => {
    if (!expenses) return [];
    const seen = new Map<string, string>();
    for (const e of expenses) {
      const lower = e.category.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, e.category);
    }
    return Array.from(seen.values());
  }, [expenses]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        majorDropdownRef.current &&
        !majorDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMajorDropdown(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await createExpense(data);
      reset();
      const isDesktop = window.matchMedia("(min-width: 768px)").matches;
      if (!isDesktop && payWithApp) {
        const upiParams = new URLSearchParams();
        upiParams.set("am", data.amount.toFixed(2));
        upiParams.set("cu", "INR");
        upiParams.set("tn", data.description || data.category);
        window.location.href = `upi://pay?${upiParams.toString()}`;
      } else {
        router.push("/dashboard");
      }
    } catch {
      // handled by hook toast
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-6 sm:pb-10 pt-2 sm:pt-4">
      {/* Page heading */}
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Add Expense
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manually log a new transaction.
        </p>
      </motion.div>

      {/* ── Animated tab switcher ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="space-y-5"
      >
        {/* Tab bar */}
        <div className="flex w-full sm:w-56 h-10 rounded-xl bg-muted p-1 relative">
          {(["single", "bulk"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={cn(
                "relative flex-1 z-10 text-sm font-medium rounded-lg transition-colors duration-200 px-3 select-none",
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              {/* Sliding pill — moves with layoutId */}
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-active-pill"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    mass: 0.7,
                  }}
                />
              )}
              {tab === "single" ? "Single" : "Bulk Upload"}
            </button>
          ))}
        </div>

        {/* Tab content with enter/exit animation */}
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {activeTab === "single" ? (
            <motion.div
              key="single"
              custom={direction}
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <Card className="border-border shadow-sm max-w-2xl">
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                  <CardDescription>
                    Fill in the details below to add a new expense.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmit(onSubmit as any)}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        {...register("amount")}
                      />
                      {errors.amount && (
                        <p className="text-sm text-destructive">
                          {errors.amount.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="e.g., Grocery shopping"
                        {...register("description")}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Major Category */}
                    <div className="space-y-2 relative">
                      <Label>Major Category</Label>
                      <div ref={majorDropdownRef} className="relative">
                        <input type="hidden" {...register("major_category")} />
                        <button
                          type="button"
                          onClick={() => {
                            setShowMajorDropdown(!showMajorDropdown);
                            setShowCategoryDropdown(false);
                          }}
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <span
                            className={
                              majorCategoryValue
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {majorCategoryValue || "Select major category"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              showMajorDropdown && "rotate-180",
                            )}
                          />
                        </button>
                        <AnimatePresence>
                          {showMajorDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden"
                            >
                              <div className="max-h-52 overflow-y-auto py-1">
                                {majorCategoryOptions.map((cat) => {
                                  const isSelected =
                                    majorCategoryValue?.toLowerCase() ===
                                    cat.toLowerCase();
                                  return (
                                    <button
                                      key={cat}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/60 hover:text-accent-foreground transition-colors cursor-pointer"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setValue("major_category", cat, {
                                          shouldValidate: true,
                                        });
                                        setShowMajorDropdown(false);
                                      }}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="bg-primary/10 text-primary border-primary/20 text-xs px-1.5 py-0"
                                      >
                                        {cat}
                                      </Badge>
                                      {isSelected && (
                                        <Check className="h-3.5 w-3.5 text-primary" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {errors.major_category && (
                        <p className="text-sm text-destructive">
                          {errors.major_category.message}
                        </p>
                      )}
                    </div>

                    {/* Sub-Category — only for Daily Expense */}
                    {isDailyExpense && (
                      <div className="space-y-2 relative">
                        <Label>Sub Category</Label>
                        <div ref={categoryDropdownRef} className="relative">
                          <input type="hidden" {...register("category")} />
                          <button
                            type="button"
                            onClick={() => {
                              setShowCategoryDropdown(!showCategoryDropdown);
                              setShowMajorDropdown(false);
                            }}
                            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <span
                              className={
                                categoryValue &&
                                categoryValue !== majorCategoryValue
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {categoryValue &&
                              categoryValue !== majorCategoryValue
                                ? categoryValue
                                : "Select a sub-category"}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                showCategoryDropdown && "rotate-180",
                              )}
                            />
                          </button>
                          <AnimatePresence>
                            {showCategoryDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden"
                              >
                                <div className="max-h-52 overflow-y-auto py-1">
                                  {subCategoryOptions.length === 0 ? (
                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                      No sub-categories yet. Type below to
                                      create one.
                                    </p>
                                  ) : (
                                    subCategoryOptions.map((cat) => {
                                      const isSelected =
                                        categoryValue?.toLowerCase() ===
                                        cat.toLowerCase();
                                      return (
                                        <button
                                          key={cat}
                                          type="button"
                                          className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/60 hover:text-accent-foreground transition-colors cursor-pointer"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            setValue("category", cat, {
                                              shouldValidate: true,
                                            });
                                            setShowCategoryDropdown(false);
                                          }}
                                        >
                                          <Badge
                                            variant="secondary"
                                            className="bg-secondary/50 text-xs px-1.5 py-0"
                                          >
                                            {cat}
                                          </Badge>
                                          {isSelected && (
                                            <Check className="h-3.5 w-3.5 text-primary" />
                                          )}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                                <div className="border-t border-border/40 p-2">
                                  <Input
                                    placeholder="Type a new sub-category..."
                                    className="h-8 text-sm"
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        (
                                          e.target as HTMLInputElement
                                        ).value.trim()
                                      ) {
                                        e.preventDefault();
                                        setValue(
                                          "category",
                                          (
                                            e.target as HTMLInputElement
                                          ).value.trim(),
                                          { shouldValidate: true },
                                        );
                                        setShowCategoryDropdown(false);
                                      }
                                    }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {errors.category && (
                          <p className="text-sm text-destructive">
                            {errors.category.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        {...register("expense_date")}
                      />
                      {errors.expense_date && (
                        <p className="text-sm text-destructive">
                          {errors.expense_date.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 md:hidden">
                      <Checkbox
                        id="pay-with-app"
                        checked={payWithApp}
                        onCheckedChange={(checked) =>
                          setPayWithApp(checked === true)
                        }
                      />
                      <Label
                        htmlFor="pay-with-app"
                        className="flex items-center gap-1.5 text-sm font-normal cursor-pointer select-none"
                      >
                        <Smartphone className="h-4 w-4" />
                        Pay with payment app (GPay / UPI)
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4" />
                      )}
                      {isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="bulk"
              custom={direction}
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <BulkExpenseTab
                majorCategoryOptions={majorCategoryOptions}
                subCategoryOptions={subCategoryOptions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
