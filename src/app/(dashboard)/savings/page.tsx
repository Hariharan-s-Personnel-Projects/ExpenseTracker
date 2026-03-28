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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  PiggyBank,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useSavingsGoals,
  useSavingsSummary,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useAddSavingsTransaction,
} from "@/hooks/useSavings";
import { SavingsGoal, SavingsCategory } from "@/types";

const SAVINGS_CATEGORIES: SavingsCategory[] = [
  "General",
  "Emergency",
  "Retirement",
  "Goal-Based",
];

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  target_amount: z.coerce.number().min(0, "Target must be 0 or more"),
  category: z.string().min(1, "Category is required"),
});

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  transaction_type: z.enum(["deposit", "withdrawal"]),
  notes: z.string().optional(),
  transaction_date: z.string().min(1, "Date is required"),
});

type GoalFormValues = z.infer<typeof goalSchema>;
type TransactionFormValues = z.infer<typeof transactionSchema>;

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

export default function SavingsPage() {
  const { data: goals, isLoading } = useSavingsGoals();
  const { data: summary } = useSavingsSummary();
  const { mutateAsync: createGoal, isPending: isCreating } =
    useCreateSavingsGoal();
  const { mutateAsync: deleteGoal } = useDeleteSavingsGoal();
  const { mutateAsync: addTransaction, isPending: isTransacting } =
    useAddSavingsTransaction();

  const [txnGoal, setTxnGoal] = useState<SavingsGoal | null>(null);
  const [showTxnDialog, setShowTxnDialog] = useState(false);

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as never,
    defaultValues: { name: "", target_amount: 0, category: "General" },
  });

  const txnForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      amount: undefined,
      transaction_type: "deposit",
      notes: "",
      transaction_date: new Date().toISOString().split("T")[0],
    },
  });

  async function onCreateGoal(data: GoalFormValues) {
    await createGoal({
      name: data.name,
      target_amount: data.target_amount,
      category: data.category,
      is_active: true,
    });
    goalForm.reset();
  }

  function openTransaction(goal: SavingsGoal) {
    setTxnGoal(goal);
    txnForm.reset({
      amount: undefined,
      transaction_type: "deposit",
      notes: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
    setShowTxnDialog(true);
  }

  async function onAddTransaction(data: TransactionFormValues) {
    if (!txnGoal) return;
    await addTransaction({
      savings_id: txnGoal.id,
      amount: data.amount,
      transaction_type: data.transaction_type,
      notes: data.notes,
      transaction_date: data.transaction_date,
    });
    setShowTxnDialog(false);
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
          Savings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Set savings goals and track your progress.
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
                <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <PiggyBank className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Saved
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                ₹{(summary?.totalSaved || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across all goals
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Active Goals
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {summary?.activeGoals || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.completedGoals || 0} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-md border border-violet-500/20">
                  <CheckCircle2 className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Overall Progress
                </span>
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {summary?.overallProgress || 0}%
              </p>
              <Progress
                value={summary?.overallProgress || 0}
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Create Goal Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                <PlusCircle className="h-4 w-4 text-amber-500" />
              </div>
              New Savings Goal
            </CardTitle>
            <CardDescription>
              Create a new savings target to work toward.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={goalForm.handleSubmit(onCreateGoal)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Goal Name</Label>
                  <Input
                    placeholder="e.g. Emergency Fund"
                    {...goalForm.register("name")}
                  />
                  {goalForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {goalForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="50000"
                    {...goalForm.register("target_amount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...goalForm.register("category")}
                  >
                    {SAVINGS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
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
                Create Goal
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No savings goals yet.</p>
            <p className="text-sm">Create your first goal above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal: SavingsGoal, i: number) => {
            const progress =
              Number(goal.target_amount) > 0
                ? Math.min(
                    Math.round(
                      (Number(goal.saved_amount) / Number(goal.target_amount)) *
                        100,
                    ),
                    100,
                  )
                : 0;
            const isComplete = progress >= 100;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card
                  className={`border-border shadow-sm ${isComplete ? "ring-1 ring-emerald-500/30" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          {goal.name}
                          {isComplete && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Saved</span>
                        <span className="font-medium">
                          ₹{Number(goal.saved_amount).toLocaleString()} / ₹
                          {Number(goal.target_amount).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2.5" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {progress}% complete
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransaction(goal)}
                          className="h-7 text-xs"
                        >
                          <ArrowUpCircle className="h-3 w-3 mr-1" />
                          Add Funds
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Transaction Dialog */}
      <Dialog open={showTxnDialog} onOpenChange={setShowTxnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {txnGoal ? `Add to "${txnGoal.name}"` : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={txnForm.handleSubmit(onAddTransaction)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                {...txnForm.register("amount")}
              />
              {txnForm.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {txnForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    txnForm.watch("transaction_type") === "deposit"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    txnForm.setValue("transaction_type", "deposit")
                  }
                  className="flex-1"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                  Deposit
                </Button>
                <Button
                  type="button"
                  variant={
                    txnForm.watch("transaction_type") === "withdrawal"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    txnForm.setValue("transaction_type", "withdrawal")
                  }
                  className="flex-1"
                >
                  <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />
                  Withdraw
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...txnForm.register("transaction_date")} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input {...txnForm.register("notes")} />
            </div>
            <Button type="submit" disabled={isTransacting} className="w-full">
              {isTransacting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Record Transaction
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
