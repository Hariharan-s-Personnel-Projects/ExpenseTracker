"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useMonthlyExpenseOverview } from "@/hooks/useBudget";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground mt-0.5">
        Spent: ₹{Number(payload[0].value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

export function WeeklyBarChart() {
  const { data, isLoading } = useMonthlyExpenseOverview();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Monthly Spending by Week
          </CardTitle>
          <CardDescription>
            See how your spending compares across weeks this month.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {isLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : !data?.byWeek?.length ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No expenses this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.byWeek}
                margin={{ top: 5, right: 16, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="weekLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
                <Bar
                  dataKey="amount"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
