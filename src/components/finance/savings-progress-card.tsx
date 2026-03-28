"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { useSavingsGoals } from "@/hooks/useSavings";

export function SavingsProgressCard() {
  const { data: goals, isLoading } = useSavingsGoals();

  if (isLoading) {
    return (
      <Card className="border-border shadow-sm h-full">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = (goals || []).filter((g) => g.is_active);
  const totalSaved = activeGoals.reduce(
    (sum, g) => sum + Number(g.saved_amount),
    0,
  );
  const totalTarget = activeGoals.reduce(
    (sum, g) => sum + Number(g.target_amount),
    0,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card className="border-border shadow-sm h-full flex flex-col">
        {" "}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <Target className="h-4 w-4 text-amber-500" />
                </div>
                Savings Goals
              </CardTitle>
              <CardDescription>
                {activeGoals.length > 0
                  ? `₹${totalSaved.toLocaleString()} saved of ₹${totalTarget.toLocaleString()} target`
                  : "No active goals yet"}
              </CardDescription>
            </div>
            <Link
              href="/savings"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {activeGoals.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-6">
              No savings goals. Create one to start tracking!
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map((goal) => {
                const saved = Number(goal.saved_amount);
                const target = Number(goal.target_amount);
                const pct = target > 0 ? (saved / target) * 100 : 0;
                const isComplete = pct >= 100;

                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {isComplete && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">
                          {goal.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-secondary/50 text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {goal.category}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      className={`h-1.5 ${isComplete ? "[&>div]:bg-emerald-500" : ""}`}
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>₹{saved.toLocaleString()}</span>
                      <span>₹{target.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
              {activeGoals.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {activeGoals.length - 4} more goals
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
