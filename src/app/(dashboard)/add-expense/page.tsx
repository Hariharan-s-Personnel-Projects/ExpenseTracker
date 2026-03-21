"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateExpense, useExpenses } from "@/hooks/useExpenses";
import { useRouter } from "next/navigation";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Date is required"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function AddExpensePage() {
  const router = useRouter();
  const { mutateAsync: createExpense, isPending } = useCreateExpense();
  const { data: expenses } = useExpenses();

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
      category: "",
      description: "",
      expense_date: new Date().toISOString().split("T")[0],
    },
  });

  const categoryValue = watch("category");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const uniqueCategories = useMemo(() => {
    if (!expenses) return [];
    const seen = new Map<string, string>();
    for (const e of expenses) {
      const lower = e.category.toLowerCase();
      if (!seen.has(lower)) seen.set(lower, e.category);
    }
    return Array.from(seen.values());
  }, [expenses]);

  const filteredSuggestions = useMemo(() => {
    if (!categoryValue) return [];
    return uniqueCategories.filter(
      (cat) =>
        cat.toLowerCase().includes(categoryValue.toLowerCase()) &&
        cat.toLowerCase() !== categoryValue.toLowerCase(),
    );
  }, [categoryValue, uniqueCategories]);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-primary">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      await createExpense(data);
      reset();
      router.push("/dashboard");
    } catch (error) {
      // Error handled by hook toast
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto pb-6 sm:pb-10 pt-2 sm:pt-4">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Add Expense
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manually log a new transaction.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm">
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

              <div className="space-y-2 relative">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Food, Transport, Utilities"
                  autoComplete="off"
                  {...register("category")}
                  ref={(e) => {
                    register("category").ref(e);
                    categoryInputRef.current = e;
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setValue("category", e.target.value, {
                      shouldValidate: true,
                    });
                    setShowSuggestions(true);
                  }}
                />
                <AnimatePresence>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <motion.div
                      ref={suggestionsRef}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1.5 rounded-lg border border-border/60 bg-popover/95 backdrop-blur-lg shadow-lg overflow-hidden"
                    >
                      <div className="px-3 py-1.5 border-b border-border/40">
                        <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                          Suggestions
                        </p>
                      </div>
                      <div className="max-h-36 overflow-y-auto py-1">
                        {filteredSuggestions.map((cat, i) => (
                          <button
                            key={cat}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent/60 hover:text-accent-foreground transition-colors cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setValue("category", cat, {
                                shouldValidate: true,
                              });
                              setShowSuggestions(false);
                            }}
                          >
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 text-xs px-1.5 py-0"
                            >
                              {highlightMatch(cat, categoryValue)}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.category && (
                  <p className="text-sm text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("expense_date")} />
                {errors.expense_date && (
                  <p className="text-sm text-destructive">
                    {errors.expense_date.message}
                  </p>
                )}
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
    </div>
  );
}
