"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { useCategorySpending } from "@/hooks/useBudget";

export function CategoryQuotaCard() {
  const { data: spending, isLoading } = useCategorySpending();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="border-border shadow-sm relative overflow-hidden">
        {" "}
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <Target className="h-4 w-4 text-primary" />
            </div>
            Spending by Category
          </CardTitle>
          <CardDescription>
            Monthly spending across all categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !spending?.length ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No category quotas set. Go to Budget & Quotas to add limits.
            </div>
          ) : (
            <div className="space-y-3">
              {spending.map((s) => {
                const isTracking = s.monthlyLimit == null;
                const isOver = !isTracking && s.spent > s.monthlyLimit!;
                const isDailyExpense = s.category === "Daily Expense";
                return (
                  <div
                    key={s.category}
                    className={`space-y-1.5 ${isDailyExpense ? "p-2 -mx-2 rounded-lg bg-primary/5 border border-primary/10" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={isDailyExpense ? "default" : "secondary"}
                          className={
                            isDailyExpense ? "text-xs" : "bg-secondary/50 text-xs"
                          }
                        >
                          {s.category}
                        </Badge>
                        {isTracking && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            Tracking
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isTracking ? (
                          <span className="text-sm font-semibold text-foreground">
                            ₹{Math.round(s.spent).toLocaleString()} spent
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground">
                              ₹{Math.round(s.spent).toLocaleString()} / ₹
                              {Math.round(s.monthlyLimit!).toLocaleString()}
                            </span>
                            <span
                              className={`text-sm font-semibold ${isOver ? "text-destructive" : "text-emerald-500"}`}
                            >
                              {isOver ? "-" : ""}₹
                              {Math.abs(Math.round(s.remaining!)).toLocaleString()}{" "}
                              left
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isTracking && (
                      <Progress
                        value={Math.min(s.percentage, 100)}
                        className={`h-1.5 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
