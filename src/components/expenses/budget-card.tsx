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
import { useBudgetSummary } from "@/hooks/useExpenses";

export function BudgetCard() {
  const { data, isLoading } = useBudgetSummary();

  if (isLoading || !data) {
    return (
      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm h-full flex flex-col justify-center p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  const {
    monthlyBudget: monthlyLimit,
    spentThisWeek,
    remainingThisWeek,
    weeklyLimit,
  } = data;
  const percentage = weeklyLimit > 0 ? (spentThisWeek / weeklyLimit) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <Wallet size={160} />
        </div>
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Weekly Overview
          </CardTitle>
          <CardDescription>
            Track your spending against your weekly limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-5xl font-bold tracking-tighter">
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
              <p className="text-2xl tracking-tight text-emerald-500 font-medium">
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
