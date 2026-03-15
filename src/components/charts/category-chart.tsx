"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "framer-motion"
import { PieChart as PieChartIcon } from "lucide-react"
import { useExpenses } from "@/hooks/useExpenses"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#a855f7", // Purple
]

export function CategoryChart() {
  const { data: expenses, isLoading } = useExpenses()

  const categoryData = (() => {
    if (!expenses || expenses.length === 0) return []
    const map: Record<string, number> = {}
    for (const e of expenses) {
      const cat = e.category || "Other"
      map[cat] = (map[cat] || 0) + Number(e.amount)
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
            Spending by Category
          </CardTitle>
          <CardDescription>Breakdown of all your expenses by category.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center p-6">
              <Skeleton className="h-full w-full max-h-[250px] rounded-full aspect-square mx-auto" />
            </div>
          ) : categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No expenses yet. Add some to see the breakdown!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="65%"
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: any) => [`€${value}`, "Spent"]}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
