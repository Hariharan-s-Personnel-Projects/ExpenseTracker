"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { useMonthlyBudgetOverview } from "@/hooks/useBudget";

export function BudgetCard() {
  const { data: overview, isLoading } = useMonthlyBudgetOverview();

  if (isLoading || !overview) {
    return (
      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm h-full flex flex-col justify-center p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  const currentWeek =
    overview.currentWeekIndex >= 0
      ? overview.weeks[overview.currentWeekIndex]
      : null;

  const spentThisWeek = currentWeek?.spent ?? 0;
  const weeklyLimit = currentWeek?.effectiveBudget ?? 0;
  const remainingThisWeek = currentWeek?.remaining ?? 0;
  const percentage = weeklyLimit > 0 ? (spentThisWeek / weeklyLimit) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden relative glow-border">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <Wallet size={160} />
        </div>
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Daily Expense — Weekly Budget
          </CardTitle>
          <CardDescription>
            Weekly spending from your daily expenses (with carry-forward).
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
            <div>
              <p className="text-3xl sm:text-5xl font-bold tracking-tighter">
                ₹
                {spentThisWeek.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-wider">
                spent this week
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl tracking-tight font-medium ${remainingThisWeek < 0 ? "text-destructive" : "text-emerald-500"}`}
              >
                ₹
                {remainingThisWeek.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                remaining of ₹
                {weeklyLimit.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Progress
              value={Math.min(percentage, 100)}
              className="h-2 bg-muted/50"
            />
            <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span>0%</span>
              <span
                className={`flex items-center gap-1 ${percentage > 85 ? "text-destructive" : ""}`}
              >
                {percentage > 85 && <AlertCircle className="h-3 w-3" />}
                {percentage.toFixed(1)}% used
              </span>
            </div>
          </div>

          {/* Daily budget indicator */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Daily budget
              </span>
              <span className="text-sm font-medium">
                ₹{overview.dailyBudget.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
