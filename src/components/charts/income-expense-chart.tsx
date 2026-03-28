"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useMoneyFlowSummary } from "@/hooks/useMoneyFlow";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function ChartTooltip({ active, payload, label }: any) {
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

export function IncomeExpenseChart() {
  const { data: flow, isLoading } = useMoneyFlowSummary();

  if (isLoading) {
    return (
      <Card className="border-border shadow-sm h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[260px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const income = flow?.totalIncome || 0;
  const expenses = flow?.totalExpenses || 0;
  const savings = flow?.totalSavings || 0;
  const invested = flow?.totalInvested || 0;

  const chartData = [
    { name: "Income", value: income, color: "#10b981" },
    { name: "Expenses", value: expenses, color: "#ef4444" },
    { name: "Savings", value: savings, color: "#f59e0b" },
    { name: "Invested", value: invested, color: "#3b82f6" },
  ];

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="h-full"
    >
      <Card className="border-border shadow-sm h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <Scale className="h-4 w-4 text-primary" />
            </div>
            Income vs Outflow
          </CardTitle>
          <CardDescription>
            How your money is split this month.
            {savingsRate > 0 && (
              <span className="ml-1 text-emerald-500 font-medium">
                Savings rate: {savingsRate.toFixed(0)}%
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[260px]">
          {income === 0 && expenses === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No income or expenses recorded this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 16, left: -10, bottom: 0 }}
                layout="vertical"
              >
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 12,
                  }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 12,
                  }}
                  width={70}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
