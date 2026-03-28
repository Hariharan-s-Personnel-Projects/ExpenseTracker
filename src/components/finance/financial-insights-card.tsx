"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Lightbulb,
  TrendingDown,
  CalendarClock,
  Flame,
  ArrowRight,
  AlertTriangle,
  Coins,
} from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useMoneyFlowSummary } from "@/hooks/useMoneyFlow";
import { useLendings } from "@/hooks/useLending";
import { isBefore, parseISO } from "date-fns";

export function FinancialInsightsCard() {
  const { data: expenses, isLoading: expLoading } = useExpenses();
  const { data: flow, isLoading: flowLoading } = useMoneyFlowSummary();
  const { data: lendings, isLoading: lendLoading } = useLendings();

  const isLoading = expLoading || flowLoading || lendLoading;

  if (isLoading) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayOfMonth = now.getDate();

  // Monthly expenses
  const monthExpenses =
    expenses?.filter((e) => new Date(e.expense_date) >= startOfMonth) || [];
  const totalMonthSpent = monthExpenses.reduce(
    (s, e) => s + Number(e.amount),
    0,
  );

  // Daily average
  const dailyAvg = dayOfMonth > 0 ? totalMonthSpent / dayOfMonth : 0;

  // Top category this month
  const catTotals: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    const cat = e.category || "Other";
    catTotals[cat] = (catTotals[cat] || 0) + Number(e.amount);
  });
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCats[0];

  // Savings rate
  const income = flow?.totalIncome || 0;
  const savingsRate =
    income > 0 ? ((income - totalMonthSpent) / income) * 100 : 0;

  // Overdue lendings
  const today = now.toISOString().split("T")[0];
  const overdue =
    lendings?.filter(
      (l) =>
        l.status !== "settled" &&
        l.due_date &&
        isBefore(parseISO(l.due_date), now),
    ) || [];

  // Expense frequency (transactions this month)
  const txCount = monthExpenses.length;

  // Projected month-end spending
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projected = dailyAvg * daysInMonth;

  const insights = [
    {
      icon: Coins,
      label: "Daily Average",
      value: `₹${Math.round(dailyAvg).toLocaleString()}`,
      sub: `${txCount} transactions this month`,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Flame,
      label: "Top Category",
      value: topCategory ? topCategory[0] : "—",
      sub: topCategory
        ? `₹${Math.round(topCategory[1]).toLocaleString()} spent`
        : "No expenses yet",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      icon: TrendingDown,
      label: "Savings Rate",
      value: `${savingsRate.toFixed(0)}%`,
      sub:
        savingsRate >= 20
          ? "Great — above 20% target"
          : savingsRate > 0
            ? "Tip: aim for at least 20%"
            : "No income recorded",
      color: savingsRate >= 20 ? "text-emerald-500" : "text-amber-500",
      bg: savingsRate >= 20 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
    {
      icon: CalendarClock,
      label: "Projected Spend",
      value: `₹${Math.round(projected).toLocaleString()}`,
      sub: `Based on ₹${Math.round(dailyAvg).toLocaleString()}/day × ${daysInMonth} days`,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: AlertTriangle,
      label: "Overdue Dues",
      value: overdue.length > 0 ? `${overdue.length} pending` : "None",
      sub:
        overdue.length > 0
          ? `₹${overdue.reduce((s, l) => s + Number(l.amount) - Number(l.settled_amount), 0).toLocaleString()} outstanding`
          : "All lending on track",
      color: overdue.length > 0 ? "text-red-500" : "text-emerald-500",
      bg: overdue.length > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
      href: overdue.length > 0 ? "/lending" : undefined,
    },
    {
      icon: Lightbulb,
      label: "Quick Tip",
      value: getQuickTip(savingsRate, dailyAvg, overdue.length, topCategory),
      sub: "",
      color: "text-primary",
      bg: "bg-primary/10",
      isWide: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="border-border shadow-sm relative overflow-hidden">
        {" "}
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((item, idx) => {
              const content = (
                <motion.div
                  key={item.label}
                  className={`p-3 rounded-lg border border-border/50 bg-background/50 ${item.isWide ? "sm:col-span-2 lg:col-span-3" : ""} ${item.href ? "hover:border-primary/30 cursor-pointer transition-colors" : ""}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-md shrink-0 mt-0.5 ${item.bg}`}
                    >
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5 ${item.isWide ? "" : "text-foreground"}`}
                      >
                        {item.value}
                      </p>
                      {item.sub && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {item.sub}
                        </p>
                      )}
                    </div>
                    {item.href && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 mt-1" />
                    )}
                  </div>
                </motion.div>
              );
              return item.href ? (
                <Link key={item.label} href={item.href}>
                  {content}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className={item.isWide ? "sm:col-span-2 lg:col-span-3" : ""}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getQuickTip(
  savingsRate: number,
  dailyAvg: number,
  overdueCount: number,
  topCategory: [string, number] | undefined,
): string {
  if (overdueCount > 0)
    return `You have ${overdueCount} overdue lending record${overdueCount > 1 ? "s" : ""}. Follow up to recover your money!`;
  if (savingsRate < 0)
    return "You're spending more than you earn this month. Review your expenses and cut non-essentials.";
  if (savingsRate < 10 && savingsRate >= 0)
    return "Your savings rate is below 10%. Try the 50/30/20 rule — 50% needs, 30% wants, 20% savings.";
  if (topCategory && topCategory[1] > dailyAvg * 10)
    return `"${topCategory[0]}" is your biggest spending area. See if there are easy ways to reduce it.`;
  if (savingsRate >= 30)
    return "Excellent savings rate! Consider putting surplus into investments for long-term growth.";
  return "You're doing well! Keep tracking consistently — awareness is the first step to financial health.";
}
