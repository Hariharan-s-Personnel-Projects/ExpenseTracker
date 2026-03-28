"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  BarChart3,
  HandCoins,
  ArrowRight,
} from "lucide-react";
import { useMoneyFlowSummary } from "@/hooks/useMoneyFlow";

export function FinanceOverviewCard() {
  const { data: flow, isLoading } = useMoneyFlowSummary();

  if (isLoading) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      label: "Income",
      value: flow?.totalIncome || 0,
      icon: ArrowUpRight,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Expenses",
      value: flow?.totalExpenses || 0,
      icon: ArrowDownRight,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Savings",
      value: flow?.totalSavings || 0,
      icon: PiggyBank,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Investments",
      value: flow?.totalInvested || 0,
      icon: BarChart3,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Lent (net)",
      value: flow?.netLending || 0,
      icon: HandCoins,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Net Cash Flow",
      value: flow?.netCashFlow || 0,
      icon: (flow?.netCashFlow || 0) >= 0 ? ArrowUpRight : ArrowDownRight,
      color:
        (flow?.netCashFlow || 0) >= 0 ? "text-emerald-500" : "text-red-500",
      bg: (flow?.netCashFlow || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <Card className="border-border shadow-sm overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium">
              Financial Overview — {flow?.month || "This Month"}
            </CardTitle>
            <CardDescription>Where your money goes this month</CardDescription>
          </div>
          <Link
            href="/money-flow"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Details <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.label}
              className="p-3 rounded-lg border border-border/50 bg-background/50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-md ${item.bg}`}>
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
              </div>
              <p className="text-lg font-bold tracking-tight">
                {item.value < 0 ? "-" : ""}₹
                {Math.abs(item.value).toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
