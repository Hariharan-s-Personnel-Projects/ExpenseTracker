"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon } from "lucide-react";
import { useMonthlyExpenseOverview } from "@/hooks/useBudget";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { category, amount, percentage } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{category}</p>
      <p className="text-muted-foreground mt-0.5">
        ₹{Number(amount).toLocaleString()} &middot; {percentage}%
      </p>
    </div>
  );
}

export function MonthlyPieChart() {
  const { data, isLoading } = useMonthlyExpenseOverview();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <Card className="border-border shadow-sm h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
            Monthly Breakdown
          </CardTitle>
          <CardDescription>
            Spending distribution by category this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[280px] w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : !data?.byCategory?.length ? (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              No expenses this month.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {data.byCategory.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold tracking-tight">
                    ₹{data.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Total
                  </p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {data.byCategory.map((entry, index) => (
                  <div
                    key={entry.category}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">
                      {entry.category}
                    </span>
                    <span className="font-medium text-foreground">
                      {entry.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
