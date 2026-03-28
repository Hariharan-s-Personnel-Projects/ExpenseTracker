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
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useLendings,
  useLendingSummary,
  useCreateLending,
  useDeleteLending,
  useAddLendingTransaction,
} from "@/hooks/useLending";
import { Lending, LendingType } from "@/types";
import { format } from "date-fns";

const lendingSchema = z.object({
  person_name: z.string().min(1, "Person name is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["lent", "borrowed"]),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

const repaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  transaction_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type LendingFormValues = z.infer<typeof lendingSchema>;
type RepaymentFormValues = z.infer<typeof repaymentSchema>;

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

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  partial: {
    label: "Partial",
    icon: AlertCircle,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  settled: {
    label: "Settled",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

export default function LendingPage() {
  const { data: lendings, isLoading } = useLendings();
  const { data: summary } = useLendingSummary();
  const { mutateAsync: createLending, isPending: isCreating } =
    useCreateLending();
  const { mutateAsync: deleteLending } = useDeleteLending();
  const { mutateAsync: addRepayment, isPending: isRepaying } =
    useAddLendingTransaction();

  const [repayLending, setRepayLending] = useState<Lending | null>(null);
  const [showRepayDialog, setShowRepayDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "lent" | "borrowed">(
    "all",
  );

  const form = useForm<LendingFormValues>({
    resolver: zodResolver(lendingSchema) as never,
    defaultValues: {
      person_name: "",
      amount: undefined,
      type: "lent",
      due_date: "",
      notes: "",
    },
  });

  const repayForm = useForm<RepaymentFormValues>({
    resolver: zodResolver(repaymentSchema) as never,
    defaultValues: {
      amount: undefined,
      transaction_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  async function onSubmit(data: LendingFormValues) {
    await createLending({
      person_name: data.person_name,
      amount: data.amount,
      type: data.type as LendingType,
      due_date: data.due_date || undefined,
      notes: data.notes,
    });
    form.reset();
  }

  function openRepay(lending: Lending) {
    setRepayLending(lending);
    repayForm.reset({
      amount: undefined,
      transaction_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowRepayDialog(true);
  }

  async function onRepay(data: RepaymentFormValues) {
    if (!repayLending) return;
    await addRepayment({
      lending_id: repayLending.id,
      amount: data.amount,
      transaction_date: data.transaction_date,
      notes: data.notes,
    });
    setShowRepayDialog(false);
  }

  const filtered = lendings?.filter((l: Lending) => {
    if (activeTab === "all") return true;
    return l.type === activeTab;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Lending & Borrowing
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Keep track of money you&apos;ve lent or borrowed.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/10 rounded-md border border-orange-500/20">
                  <ArrowUpRight className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Lent
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.totalLent || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{(summary?.pendingLent || 0).toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-md border border-violet-500/20">
                  <ArrowDownLeft className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Borrowed
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.totalBorrowed || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{(summary?.pendingBorrowed || 0).toLocaleString()} pending
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Settled (Lent)
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.settledLent || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={3}>
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Settled (Borrowed)
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.settledBorrowed || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Add Lending Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded-md border border-orange-500/20">
                <HandCoins className="h-4 w-4 text-orange-500" />
              </div>
              New Record
            </CardTitle>
            <CardDescription>
              Track money lent to or borrowed from someone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      form.watch("type") === "lent" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => form.setValue("type", "lent")}
                    className="flex-1"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />I Lent Money
                  </Button>
                  <Button
                    type="button"
                    variant={
                      form.watch("type") === "borrowed" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => form.setValue("type", "borrowed")}
                    className="flex-1"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />I Borrowed
                    Money
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Person Name</Label>
                  <Input
                    placeholder="e.g. John"
                    {...form.register("person_name")}
                  />
                  {form.formState.errors.person_name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.person_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("amount")}
                  />
                  {form.formState.errors.amount && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Due Date (optional)</Label>
                  <Input type="date" {...form.register("due_date")} />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Reason..." {...form.register("notes")} />
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
                Add Record
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter Tabs + List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-medium">
                  All Records
                </CardTitle>
                <CardDescription>
                  Your lending and borrowing history.
                </CardDescription>
              </div>
              <div className="flex gap-1 bg-muted/50 rounded-md p-1">
                {(["all", "lent", "borrowed"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "all"
                      ? "All"
                      : tab === "lent"
                        ? "Lent"
                        : "Borrowed"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !filtered || filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HandCoins className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No records found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((lending: Lending) => {
                  const config = statusConfig[lending.status];
                  const StatusIcon = config.icon;
                  const progress =
                    Number(lending.amount) > 0
                      ? Math.round(
                          (Number(lending.settled_amount) /
                            Number(lending.amount)) *
                            100,
                        )
                      : 0;
                  const remaining =
                    Number(lending.amount) - Number(lending.settled_amount);
                  const isOverdue =
                    lending.due_date &&
                    lending.status !== "settled" &&
                    new Date(lending.due_date) < new Date();

                  return (
                    <div
                      key={lending.id}
                      className={`p-3 rounded-lg border transition-colors hover:bg-muted/30 ${
                        isOverdue ? "border-red-500/30" : "border-border/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-md ${lending.type === "lent" ? "bg-orange-500/10" : "bg-violet-500/10"}`}
                          >
                            {lending.type === "lent" ? (
                              <ArrowUpRight className="h-4 w-4 text-orange-500" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4 text-violet-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">
                                {lending.person_name}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {lending.type === "lent" ? "Lent" : "Borrowed"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${config.color}`}
                              >
                                <StatusIcon className="h-2.5 w-2.5 mr-1" />
                                {config.label}
                              </Badge>
                              {isOverdue && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg font-bold mt-1">
                              ₹{Number(lending.amount).toLocaleString()}
                            </p>
                            {lending.status !== "settled" &&
                              Number(lending.settled_amount) > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  <Progress
                                    value={progress}
                                    className="h-1.5"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    ₹
                                    {Number(
                                      lending.settled_amount,
                                    ).toLocaleString()}{" "}
                                    settled · ₹{remaining.toLocaleString()}{" "}
                                    remaining
                                  </p>
                                </div>
                              )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              {lending.due_date && (
                                <span>
                                  Due:{" "}
                                  {format(
                                    new Date(lending.due_date),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              )}
                              {lending.notes && <span>· {lending.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {lending.status !== "settled" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => openRepay(lending)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Repay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteLending(lending.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Repayment Dialog */}
      <Dialog open={showRepayDialog} onOpenChange={setShowRepayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Record Payment
              {repayLending ? ` — ${repayLending.person_name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {repayLending && (
            <div className="text-sm text-muted-foreground mb-2">
              Total: ₹{Number(repayLending.amount).toLocaleString()} · Settled:
              ₹{Number(repayLending.settled_amount).toLocaleString()} ·
              Remaining: ₹
              {(
                Number(repayLending.amount) -
                Number(repayLending.settled_amount)
              ).toLocaleString()}
            </div>
          )}
          <form
            onSubmit={repayForm.handleSubmit(onRepay)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                {...repayForm.register("amount")}
              />
              {repayForm.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {repayForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...repayForm.register("transaction_date")} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input {...repayForm.register("notes")} />
            </div>
            <Button type="submit" disabled={isRepaying} className="w-full">
              {isRepaying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Record Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
