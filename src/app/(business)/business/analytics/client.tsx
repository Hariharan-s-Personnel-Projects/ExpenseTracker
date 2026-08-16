"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
}

interface Props {
  stats: {
    totalSpend: number;
    monthSpend: number;
    categoryBreakdown: Record<string, number>;
    categories: { name: string; monthly_budget: number | null }[];
  };
  expenses: Expense[];
}

export default function AnalyticsClient({ stats, expenses }: Props) {
  // Monthly trend
  const monthlyTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const month = e.expense_date.slice(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] ?? 0) + Number(e.amount);
  });
  const months = Object.entries(monthlyTotals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);

  const maxMonthly = Math.max(...months.map((m) => m[1]), 1);

  // Category breakdown
  const categories = Object.entries(stats.categoryBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...categories.map((c) => c[1]), 1);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Approved expense breakdown</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Monthly Spend (last 6 months)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {months.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved expense data yet.
                </p>
              ) : (
                months.map(([month, total]) => (
                  <div key={month} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{month}</span>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(total / maxMonthly) * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category breakdown */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                This Month by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved expenses this month.
                </p>
              ) : (
                categories.map(([cat, amount]) => {
                  const budget = stats.categories.find((c) => c.name === cat)?.monthly_budget;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium truncate max-w-[160px]">{cat}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">
                          {formatCurrency(amount)}
                          {budget ? ` / ${formatCurrency(budget)}` : ""}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(amount / maxCat) * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Approved</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthSpend)}</p>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Categories</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{expenses.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
