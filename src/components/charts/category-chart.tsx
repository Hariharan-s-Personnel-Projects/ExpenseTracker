"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { LineChart as LineChartIcon } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { format, subDays, parseISO, isSameDay } from "date-fns";

// Indigo/violet palette to match the Weekly Spending chart theme
const PALETTE = [
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a78bfa", // violet-400
  "#4f46e5", // indigo-600
  "#7c3aed", // violet-600
  "#818cf8", // indigo-400
  "#c4b5fd", // violet-300
];

function getColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

function CategoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p: any) => p.value > 0);
  if (items.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-lg shadow-lg px-3 py-2 text-sm min-w-[120px]">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {items.map((item: any) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
          </span>
          <span className="font-medium text-foreground">
            ₹{Number(item.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CategoryChart() {
  const { data: expenses, isLoading } = useExpenses();

  const last7Days = Array.from({ length: 7 }).map((_, i) =>
    subDays(new Date(), 6 - i),
  );

  const categories = Array.from(
    new Set(expenses?.map((e) => e.category || "Other") ?? []),
  ).sort();

  const chartData = last7Days.map((date) => {
    const point: Record<string, string | number> = {
      day: format(date, "EEE"),
    };
    for (const cat of categories) {
      const total =
        expenses
          ?.filter(
            (e) =>
              (e.category || "Other") === cat &&
              isSameDay(parseISO(e.expense_date), date),
          )
          .reduce((acc, curr) => acc + Number(curr.amount), 0) ?? 0;
      point[cat] = Number(total.toFixed(2));
    }
    return point;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-sm glow-border relative overflow-hidden card-hover">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <LineChartIcon className="h-4 w-4 text-primary" />
            </div>
            Spending by Category
          </CardTitle>
          <CardDescription>
            Daily spending per category over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {isLoading ? (
            <div className="h-[300px] w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              No expenses yet. Add some to see the breakdown!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 16, left: -20, bottom: 0 }}
              >
                <defs>
                  {categories.map((cat, index) => (
                    <linearGradient
                      key={`grad-${cat}`}
                      id={`grad-${cat}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={getColor(index)}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={getColor(index)}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip content={<CategoryTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
                {categories.map((cat, index) => (
                  <Line
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stroke={getColor(index)}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 0, fill: getColor(index) }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
