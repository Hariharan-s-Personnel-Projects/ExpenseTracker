"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  BarChart3,
  HandCoins,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useMoneyFlowSummary } from "@/hooks/useMoneyFlow";
import { useMonthlyIncomeSummary } from "@/hooks/useIncome";
import { useSavingsSummary } from "@/hooks/useSavings";
import { useInvestmentSummary } from "@/hooks/useInvestments";
import { useLendingSummary } from "@/hooks/useLending";

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

function FlowCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> =
    {
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-500",
      },
      red: {
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        text: "text-red-500",
      },
      amber: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        text: "text-amber-500",
      },
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-500",
      },
      orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-500",
      },
      violet: {
        bg: "bg-violet-500/10",
        border: "border-violet-500/20",
        text: "text-violet-500",
      },
    };
  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 ${c.bg} rounded-md border ${c.border}`}>
            <Icon className={`h-4 w-4 ${c.text}`} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {value < 0 ? "-" : ""}₹{Math.abs(value).toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SankeyFlow({
  income,
  expenses,
  savings,
  investments,
  netLending,
  netCashFlow,
}: {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  netLending: number;
  netCashFlow: number;
}) {
  const items = [
    {
      label: "Expenses",
      value: expenses,
      pct: income > 0 ? (expenses / income) * 100 : 0,
      color: "bg-red-500",
    },
    {
      label: "Savings",
      value: savings,
      pct: income > 0 ? (savings / income) * 100 : 0,
      color: "bg-amber-500",
    },
    {
      label: "Investments",
      value: investments,
      pct: income > 0 ? (investments / income) * 100 : 0,
      color: "bg-blue-500",
    },
    {
      label: "Lent (net)",
      value: Math.max(netLending, 0),
      pct: income > 0 ? (Math.max(netLending, 0) / income) * 100 : 0,
      color: "bg-orange-500",
    },
    {
      label: "Unallocated",
      value: Math.max(netCashFlow, 0),
      pct: income > 0 ? (Math.max(netCashFlow, 0) / income) * 100 : 0,
      color: "bg-emerald-500",
    },
  ].filter((i) => i.value > 0);

  return (
    <Card className="border-border shadow-sm overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          Money Flow — Where Does Your Money Go?
        </CardTitle>
        <CardDescription>
          Visual breakdown of how your income is distributed this month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {income === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No income recorded this month.</p>
            <p className="text-sm">Add income to see your money flow.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Income bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-emerald-500">
                  Total Income
                </span>
                <span className="text-sm font-bold">
                  ₹{income.toLocaleString()}
                </span>
              </div>
              <div className="h-8 rounded-lg bg-emerald-500/20 overflow-hidden relative">
                <motion.div
                  className="h-full bg-emerald-500 rounded-lg"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <div className="w-px h-4 bg-border" />
                <ArrowDownRight className="h-4 w-4" />
                <span className="text-xs">Distributed to</span>
                <div className="w-px h-4 bg-border" />
              </div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{item.value.toLocaleString()} ({item.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-5 rounded-md bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full rounded-md ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.pct, 100)}%` }}
                      transition={{
                        duration: 0.6,
                        delay: idx * 0.1,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {netCashFlow < 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You&apos;re spending ₹
                    {Math.abs(netCashFlow).toLocaleString()} more than you earn
                    this month
                  </span>
                </div>
              </div>
            )}

            {netCashFlow > 0 && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    ₹{netCashFlow.toLocaleString()} remaining after all
                    allocations
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MoneyFlowPage() {
  const { data: flow, isLoading } = useMoneyFlowSummary();
  const { data: incomeSummary } = useMonthlyIncomeSummary();
  const { data: savingsSummary } = useSavingsSummary();
  const { data: investmentSummary } = useInvestmentSummary();
  const { data: lendingSummary } = useLendingSummary();

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
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
          Money Flow
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {flow?.month ? `${flow.month} — ` : ""}Complete overview of how your
          money moves.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <FlowCard
            label="Income"
            value={flow?.totalIncome || 0}
            icon={ArrowUpRight}
            color="emerald"
            subtitle={`${incomeSummary?.bySource?.length || 0} sources`}
          />
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <FlowCard
            label="Expenses"
            value={flow?.totalExpenses || 0}
            icon={ArrowDownRight}
            color="red"
            subtitle="This month"
          />
        </motion.div>
        <motion.div variants={fadeUp} custom={2}>
          <FlowCard
            label="Savings"
            value={savingsSummary?.totalSaved || 0}
            icon={PiggyBank}
            color="amber"
            subtitle={`${savingsSummary?.activeGoals || 0} active goals`}
          />
        </motion.div>
        <motion.div variants={fadeUp} custom={3}>
          <FlowCard
            label="Investments"
            value={investmentSummary?.totalInvested || 0}
            icon={BarChart3}
            color="blue"
            subtitle={`${(investmentSummary?.returnPercentage || 0) >= 0 ? "+" : ""}${investmentSummary?.returnPercentage || 0}% returns`}
          />
        </motion.div>
        <motion.div variants={fadeUp} custom={4}>
          <FlowCard
            label="Lent Out (Pending)"
            value={lendingSummary?.pendingLent || 0}
            icon={HandCoins}
            color="orange"
            subtitle={`₹${(lendingSummary?.pendingBorrowed || 0).toLocaleString()} owed to others`}
          />
        </motion.div>
        <motion.div variants={fadeUp} custom={5}>
          <FlowCard
            label="Net Cash Flow"
            value={flow?.netCashFlow || 0}
            icon={(flow?.netCashFlow || 0) >= 0 ? TrendingUp : TrendingDown}
            color={(flow?.netCashFlow || 0) >= 0 ? "emerald" : "red"}
            subtitle="Income - Expenses - Savings - Investments"
          />
        </motion.div>
      </motion.div>

      {/* Visual Money Flow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SankeyFlow
          income={flow?.totalIncome || 0}
          expenses={flow?.totalExpenses || 0}
          savings={flow?.totalSavings || 0}
          investments={flow?.totalInvested || 0}
          netLending={flow?.netLending || 0}
          netCashFlow={flow?.netCashFlow || 0}
        />
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Savings Rate */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Savings Rate
            </CardTitle>
            <CardDescription>
              Percentage of income that goes to savings + investments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(flow?.totalIncome || 0) > 0 ? (
              <>
                <p className="text-4xl font-bold tracking-tight text-amber-500">
                  {Math.round(
                    (((flow?.totalSavings || 0) + (flow?.totalInvested || 0)) /
                      (flow?.totalIncome || 1)) *
                      100,
                  )}
                  %
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ₹
                  {(
                    (flow?.totalSavings || 0) + (flow?.totalInvested || 0)
                  ).toLocaleString()}{" "}
                  out of ₹{(flow?.totalIncome || 0).toLocaleString()}
                </p>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-3">
                  <motion.div
                    className="h-full rounded-full bg-amber-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        Math.round(
                          (((flow?.totalSavings || 0) +
                            (flow?.totalInvested || 0)) /
                            (flow?.totalIncome || 1)) *
                            100,
                        ),
                        100,
                      )}%`,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Add income to see your savings rate.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Ratio */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Expense Ratio
            </CardTitle>
            <CardDescription>
              Percentage of income spent on expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(flow?.totalIncome || 0) > 0 ? (
              <>
                {(() => {
                  const ratio = Math.round(
                    ((flow?.totalExpenses || 0) / (flow?.totalIncome || 1)) *
                      100,
                  );
                  const isHigh = ratio > 70;
                  return (
                    <>
                      <p
                        className={`text-4xl font-bold tracking-tight ${isHigh ? "text-red-500" : "text-emerald-500"}`}
                      >
                        {ratio}%
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ₹{(flow?.totalExpenses || 0).toLocaleString()} out of ₹
                        {(flow?.totalIncome || 0).toLocaleString()}
                      </p>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden mt-3">
                        <motion.div
                          className={`h-full rounded-full ${isHigh ? "bg-red-500" : "bg-emerald-500"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(ratio, 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Add income to see your expense ratio.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
