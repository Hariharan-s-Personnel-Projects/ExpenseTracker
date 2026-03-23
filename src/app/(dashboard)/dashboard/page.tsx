"use client";

import { motion } from "framer-motion";
import { BudgetCard } from "@/components/expenses/budget-card";
import { SpendingChart } from "@/components/charts/spending-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { MonthlyPieChart } from "@/components/charts/monthly-pie-chart";
import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { CategoryQuotaCard } from "@/components/expenses/category-quota-card";
import { RecentExpenses } from "@/components/expenses/recent-expenses";
import { AiQuickInput } from "@/components/ai/ai-quick-input";

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

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <motion.div
        className="flex flex-col gap-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back. Here&apos;s your financial overview.
        </p>
      </motion.div>

      {/* AI Quick Input */}
      <AiQuickInput />

      {/* Row 1: Daily Expense Weekly Budget + Category Quotas */}
      <motion.div
        className="grid gap-4 sm:gap-6 md:grid-cols-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp} custom={0}>
          <BudgetCard />
        </motion.div>
        <motion.div variants={fadeUp} custom={1}>
          <CategoryQuotaCard />
        </motion.div>
      </motion.div>

      {/* Row 2: Monthly Pie + Weekly Spending (last 7d) */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <MonthlyPieChart />
        <SpendingChart />
      </div>

      {/* Row 3: Weekly Bar Chart (monthly by week) */}
      <WeeklyBarChart />

      {/* Row 4: Sub-Category Trend (last 7 days) */}
      <CategoryChart />

      {/* Row 5: Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <RecentExpenses />
      </motion.div>
    </div>
  );
}
