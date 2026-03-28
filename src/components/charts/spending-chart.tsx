"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { format, subDays, parseISO, isSameDay } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

function SpendingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground mt-0.5">
        ₹{Number(payload[0].value ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

export function SpendingChart() {
  const { data: expenses, isLoading } = useExpenses();

  // Calculate spending per day for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    // Traverse backwards 6 days to today
    const date = subDays(new Date(), 6 - i);
    // Find expenses matching this specific day
    const dayExpenses =
      expenses?.filter((e) => isSameDay(parseISO(e.expense_date), date)) || [];
    const sum = dayExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      date: date,
      day: format(date, "EEE"), // Mon, Tue, etc
      amount: Number(sum.toFixed(2)),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full"
    >
      <Card className="border-border shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Weekly Spending
          </CardTitle>
          <CardDescription>
            Visualizing your expenses over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center p-6">
              <Skeleton className="h-full w-full max-h-[250px]" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  content={<SpendingTooltip />}
                  cursor={{
                    stroke: "var(--color-muted-foreground)",
                    strokeDasharray: "3 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
