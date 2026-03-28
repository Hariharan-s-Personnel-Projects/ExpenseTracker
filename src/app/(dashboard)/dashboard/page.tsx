"use client";

import { motion } from "framer-motion";
import { BudgetCard } from "@/components/expenses/budget-card";
import { SpendingChart } from "@/components/charts/spending-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { MonthlyPieChart } from "@/components/charts/monthly-pie-chart";
import { WeeklyBarChart } from "@/components/charts/weekly-bar-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { CategoryQuotaCard } from "@/components/expenses/category-quota-card";
import { RecentExpenses } from "@/components/expenses/recent-expenses";
import { AiQuickInput } from "@/components/ai/ai-quick-input";
import { FinanceOverviewCard } from "@/components/finance/finance-overview-card";
import { SavingsProgressCard } from "@/components/finance/savings-progress-card";
import { FinancialInsightsCard } from "@/components/finance/financial-insights-card";

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function DashboardPage() {
  return (
    <motion.div
      className="space-y-6 sm:space-y-8 pb-6 sm:pb-10"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div className="flex flex-col gap-1" variants={fadeUp}>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back. Here&apos;s your financial overview.
        </p>
      </motion.div>

      {/* AI Quick Input */}
      <motion.div variants={fadeUp}>
        <AiQuickInput />
      </motion.div>

      {/* Financial Overview — Full Picture */}
      <motion.div variants={fadeUp}>
        <FinanceOverviewCard />
      </motion.div>

      {/* Financial Insights — Smart computed stats */}
      <motion.div variants={fadeUp}>
        <FinancialInsightsCard />
      </motion.div>

      {/* Row 1: Daily Expense Weekly Budget + Category Quotas */}
      <motion.div
        className="grid gap-4 sm:gap-6 md:grid-cols-2"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <BudgetCard />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CategoryQuotaCard />
        </motion.div>
      </motion.div>

      {/* Row 2: Income vs Outflow + Savings Goals */}
      <motion.div
        className="grid gap-4 sm:gap-6 md:grid-cols-2"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <IncomeExpenseChart />
        </motion.div>
        <motion.div variants={fadeUp}>
          <SavingsProgressCard />
        </motion.div>
      </motion.div>

      {/* Row 3: Monthly Pie + Weekly Spending (last 7d) */}
      <motion.div
        className="grid gap-4 sm:gap-6 md:grid-cols-2"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <MonthlyPieChart />
        </motion.div>
        <motion.div variants={fadeUp}>
          <SpendingChart />
        </motion.div>
      </motion.div>

      {/* Row 4: Weekly Bar Chart (monthly by week) */}
      <motion.div variants={fadeUp}>
        <WeeklyBarChart />
      </motion.div>

      {/* Row 5: Sub-Category Trend (last 7 days) */}
      <motion.div variants={fadeUp}>
        <CategoryChart />
      </motion.div>

      {/* Row 6: Recent Expenses */}
      <motion.div variants={fadeUp}>
        <RecentExpenses />
      </motion.div>
    </motion.div>
  );
}
