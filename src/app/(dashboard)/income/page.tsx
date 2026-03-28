"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  Loader2,
  Wallet,
  TrendingUp,
  RefreshCw,
  Trash2,
  Pencil,
  IndianRupee,
  ChevronDown,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useIncomes,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
  useMonthlyIncomeSummary,
} from "@/hooks/useIncome";
import { Income, IncomeSource } from "@/types";
import { format } from "date-fns";

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

const incomeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  source: z.string().min(1, "Source is required"),
  income_date: z.string().min(1, "Date is required"),
  is_recurring: z.boolean().default(false),
  notes: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export default function IncomePage() {
  const { data: incomes, isLoading } = useIncomes();
  const { data: summary } = useMonthlyIncomeSummary();
  const { mutateAsync: createIncome, isPending: isCreating } =
    useCreateIncome();
  const { mutateAsync: updateIncome, isPending: isUpdating } =
    useUpdateIncome();
  const { mutateAsync: deleteIncome } = useDeleteIncome();

  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema) as never,
    defaultValues: {
      amount: undefined,
      source: "",
      income_date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      notes: "",
    },
  });

  const editForm = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema) as never,
  });

  const sourceValue = watch("source");

  async function onSubmit(data: IncomeFormValues) {
    await createIncome({
      amount: data.amount,
      source: data.source,
      income_date: data.income_date,
      is_recurring: data.is_recurring,
      notes: data.notes,
    });
    reset({
      amount: undefined,
      source: "",
      income_date: new Date().toISOString().split("T")[0],
      is_recurring: false,
      notes: "",
    });
  }

  async function onEdit(data: IncomeFormValues) {
    if (!editingIncome) return;
    await updateIncome({ id: editingIncome.id, ...data });
    setShowEditDialog(false);
    setEditingIncome(null);
  }

  function openEdit(income: Income) {
    setEditingIncome(income);
    editForm.reset({
      amount: income.amount,
      source: income.source,
      income_date: income.income_date,
      is_recurring: income.is_recurring,
      notes: income.notes || "",
    });
    setShowEditDialog(true);
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Income
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track all your income sources and earnings.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <IndianRupee className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Income
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                ₹{(summary?.totalIncome || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Recurring
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                ₹{(summary?.recurringIncome || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly recurring
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-md border border-violet-500/20">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Sources
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {summary?.bySource?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Active sources
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Add Income Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                <PlusCircle className="h-4 w-4 text-emerald-500" />
              </div>
              Add Income
            </CardTitle>
            <CardDescription>Record a new income entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("amount")}
                  />
                  {errors.amount && (
                    <p className="text-xs text-destructive">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Source</Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={
                          sourceValue
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {sourceValue || "Select source..."}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                    <AnimatePresence>
                      {showSourceDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md"
                        >
                          {INCOME_SOURCES.map((source) => (
                            <button
                              key={source}
                              type="button"
                              onClick={() => {
                                setValue("source", source, {
                                  shouldValidate: true,
                                });
                                setShowSourceDropdown(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                            >
                              {sourceValue === source && (
                                <Check className="h-3 w-3 text-primary" />
                              )}
                              <span
                                className={
                                  sourceValue === source
                                    ? "font-medium text-primary"
                                    : ""
                                }
                              >
                                {source}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.source && (
                    <p className="text-xs text-destructive">
                      {errors.source.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income_date">Date</Label>
                  <Input
                    id="income_date"
                    type="date"
                    {...register("income_date")}
                  />
                  {errors.income_date && (
                    <p className="text-xs text-destructive">
                      {errors.income_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g. March salary"
                    {...register("notes")}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_recurring"
                  checked={watch("is_recurring")}
                  onCheckedChange={(checked) =>
                    setValue("is_recurring", checked === true)
                  }
                />
                <Label
                  htmlFor="is_recurring"
                  className="text-sm cursor-pointer"
                >
                  This is a recurring income (comes every month)
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Add Income
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Income by Source Breakdown */}
      {summary && summary.bySource.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Income Breakdown
              </CardTitle>
              <CardDescription>
                This month&apos;s income by source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.bySource.map((item) => (
                  <div key={item.source} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.source}</span>
                      <span className="text-muted-foreground">
                        ₹{item.amount.toLocaleString()} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Income List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">All Income</CardTitle>
            <CardDescription>
              Complete history of your income entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !incomes || incomes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No income recorded yet.</p>
                <p className="text-sm">Add your first income above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomes.map((income: Income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-500/10 rounded-md">
                        <IndianRupee className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          ₹{Number(income.amount).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {income.source}
                          </Badge>
                          <span>
                            {format(
                              new Date(income.income_date),
                              "MMM d, yyyy",
                            )}
                          </span>
                          {income.is_recurring && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-2.5 w-2.5 mr-1" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                        {income.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {income.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(income)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteIncome(income.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                {...editForm.register("amount")}
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...editForm.register("source")}
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...editForm.register("income_date")} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...editForm.register("notes")} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={editForm.watch("is_recurring")}
                onCheckedChange={(checked) =>
                  editForm.setValue("is_recurring", checked === true)
                }
              />
              <Label className="text-sm cursor-pointer">Recurring</Label>
            </div>
            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
