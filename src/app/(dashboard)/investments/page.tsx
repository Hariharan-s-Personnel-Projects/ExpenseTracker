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
  TrendingUp,
  TrendingDown,
  BarChart3,
  Trash2,
  Pencil,
  LineChart,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useInvestments,
  useInvestmentSummary,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
} from "@/hooks/useInvestments";
import { Investment, InvestmentType } from "@/types";
import { format } from "date-fns";

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

const investmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  invested_amount: z.coerce.number().min(0, "Amount must be 0 or more"),
  current_value: z.coerce.number().min(0, "Value must be 0 or more"),
  units: z.coerce.number().optional(),
  purchase_date: z.string().optional(),
  notes: z.string().optional(),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

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

export default function InvestmentsPage() {
  const { data: investments, isLoading } = useInvestments();
  const { data: summary } = useInvestmentSummary();
  const { mutateAsync: createInvestment, isPending: isCreating } =
    useCreateInvestment();
  const { mutateAsync: updateInvestment, isPending: isUpdating } =
    useUpdateInvestment();
  const { mutateAsync: deleteInvestment } = useDeleteInvestment();

  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const form = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as never,
    defaultValues: {
      name: "",
      type: "Mutual Funds",
      invested_amount: undefined,
      current_value: undefined,
      units: undefined,
      purchase_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const editForm = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as never,
  });

  async function onSubmit(data: InvestmentFormValues) {
    await createInvestment({
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      units: data.units,
      purchase_date: data.purchase_date,
      notes: data.notes,
      is_active: true,
    });
    form.reset();
  }

  function openEdit(inv: Investment) {
    setEditingInv(inv);
    editForm.reset({
      name: inv.name,
      type: inv.type,
      invested_amount: inv.invested_amount,
      current_value: inv.current_value,
      units: inv.units ?? undefined,
      purchase_date: inv.purchase_date || "",
      notes: inv.notes || "",
    });
    setShowEditDialog(true);
  }

  async function onEdit(data: InvestmentFormValues) {
    if (!editingInv) return;
    await updateInvestment({
      id: editingInv.id,
      name: data.name,
      type: data.type,
      invested_amount: data.invested_amount,
      current_value: data.current_value,
      units: data.units,
      purchase_date: data.purchase_date,
      notes: data.notes,
      is_active: true,
    });
    setShowEditDialog(false);
  }

  const totalReturns = summary?.totalReturns || 0;
  const isPositive = totalReturns >= 0;

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Investments
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track your investment portfolio and returns.
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Invested
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.totalInvested || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-md border border-violet-500/20">
                  <LineChart className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Current Value
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight">
                ₹{(summary?.totalCurrentValue || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-md border ${isPositive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Returns
                </span>
              </div>
              <p
                className={`text-2xl font-bold tracking-tight ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}₹{totalReturns.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeUp} custom={3}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-md border ${isPositive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Return %
                </span>
              </div>
              <p
                className={`text-2xl font-bold tracking-tight ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              >
                {isPositive ? "+" : ""}
                {summary?.returnPercentage || 0}%
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Portfolio Breakdown by Type */}
      {summary && summary.byType.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Portfolio Breakdown
              </CardTitle>
              <CardDescription>Investment distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.byType.map((item) => {
                  const pct =
                    summary.totalInvested > 0
                      ? Math.round(
                          (item.invested / summary.totalInvested) * 100,
                        )
                      : 0;
                  const returnPct =
                    item.invested > 0
                      ? ((item.returns / item.invested) * 100).toFixed(1)
                      : "0";
                  const itemPositive = item.returns >= 0;

                  return (
                    <div key={item.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.type}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>₹{item.invested.toLocaleString()}</span>
                          <span
                            className={
                              itemPositive ? "text-emerald-500" : "text-red-500"
                            }
                          >
                            {itemPositive ? "+" : ""}
                            {returnPct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add Investment Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                <PlusCircle className="h-4 w-4 text-blue-500" />
              </div>
              Add Investment
            </CardTitle>
            <CardDescription>
              Track a new investment in your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Investment Name</Label>
                  <Input
                    placeholder="e.g. NIFTY 50 Index Fund"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...form.register("type")}
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Invested Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("invested_amount")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Value (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("current_value")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Units (optional)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="e.g. 10.5"
                    {...form.register("units")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input type="date" {...form.register("purchase_date")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Any additional details..."
                  {...form.register("notes")}
                />
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
                Add Investment
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Investments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              All Investments
            </CardTitle>
            <CardDescription>Your complete portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !investments || investments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No investments yet.</p>
                <p className="text-sm">Add your first investment above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {investments.map((inv: Investment) => {
                  const returns =
                    Number(inv.current_value) - Number(inv.invested_amount);
                  const returnPct =
                    Number(inv.invested_amount) > 0
                      ? ((returns / Number(inv.invested_amount)) * 100).toFixed(
                          1,
                        )
                      : "0";
                  const invPositive = returns >= 0;

                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-md ${invPositive ? "bg-emerald-500/10" : "bg-red-500/10"}`}
                        >
                          {invPositive ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {inv.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {inv.type}
                            </Badge>
                            <span>
                              Invested: ₹
                              {Number(inv.invested_amount).toLocaleString()}
                            </span>
                            <span
                              className={
                                invPositive
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }
                            >
                              {invPositive ? "+" : ""}
                              {returnPct}% ({invPositive ? "+" : ""}₹
                              {returns.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <div className="text-right mr-2 hidden sm:block">
                          <p className="text-sm font-medium">
                            ₹{Number(inv.current_value).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            current
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(inv)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteInvestment(inv.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Investment</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...editForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...editForm.register("type")}
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Invested (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...editForm.register("invested_amount")}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Value (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...editForm.register("current_value")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Units</Label>
              <Input
                type="number"
                step="0.001"
                {...editForm.register("units")}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...editForm.register("notes")} />
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
