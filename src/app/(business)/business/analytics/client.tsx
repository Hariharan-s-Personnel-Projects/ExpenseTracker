"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Receipt,
  Boxes,
  AlertTriangle,
  Package,
  DollarSign,
  Users2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesAnalytics, InventoryStats } from "@/actions/analytics";

// ─── Animation ────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Color Palette ────────────────────────────────────────────────────────────

const C = {
  revenue: "#818cf8",
  expenses: "#fb7185",
  profit: "#34d399",
  units: "#38bdf8",
  inStock: "#34d399",
  lowStock: "#fbbf24",
  outOfStock: "#fb7185",
  segments: ["#818cf8", "#fbbf24", "#34d399", "#fb7185", "#38bdf8", "#a78bfa"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtAxis(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}

function pct(a: number, b: number) {
  if (b === 0) return null;
  return ((a - b) / b) * 100;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  currency = true,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; fill?: string }[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-2xl text-xs min-w-[160px] pointer-events-none">
      {label && (
        <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border/60 truncate max-w-[220px]">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const swatch = entry.fill ?? entry.color;
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: swatch }} />
                <span className="text-foreground truncate">{entry.name}</span>
              </span>
              <span className="font-semibold tabular-nums shrink-0" style={{ color: swatch }}>
                {currency ? fmt(entry.value) : entry.value.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bar Hover Cursor ─────────────────────────────────────────────────────────
// Uses style= so CSS custom properties resolve correctly (SVG presentation
// attributes don't support var(--...)).

function BarCursor({ x, y, width, height }: { x?: number; y?: number; width?: number; height?: number }) {
  if (x == null || y == null) return null;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={3}
      style={{ fill: "var(--color-muted)", opacity: 0.55 }}
    />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  color = "text-primary",
  trend,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  trend?: { value: number } | null;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            {trend !== undefined && trend !== null && (
              <div
                className={`flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${
                  trend.value >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(trend.value).toFixed(1)}% vs last month
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-muted/50 shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
}

interface Props {
  stats: {
    totalSpend: number;
    monthSpend: number;
    pendingCount: number;
    pendingAmount: number;
    memberCount: number;
    categoryBreakdown: Record<string, number>;
    categories: { name: string; monthly_budget: number | null }[];
  };
  expenses: Expense[];
  salesAnalytics: SalesAnalytics | null;
  inventoryStats: InventoryStats | null;
  isRetail: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({
  stats,
  expenses,
  salesAnalytics,
  inventoryStats,
  isRetail,
}: Props) {
  // ── Monthly expense map keyed by YYYY-MM ──
  const expByMonthKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.expense_date.substring(0, 7);
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    return map;
  }, [expenses]);

  // ── Combined monthly trend data (last 12 months) ──
  const monthlyTrends = useMemo(() => {
    if (salesAnalytics) {
      return salesAnalytics.monthly.map((m) => ({
        month: m.month,
        Revenue: m.revenue,
        Expenses: expByMonthKey.get(m.monthKey) ?? 0,
        Profit: m.revenue - (expByMonthKey.get(m.monthKey) ?? 0),
      }));
    }
    // Non-retail: just expenses, last 12 months
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
      return {
        month: `${mon} '${String(d.getFullYear()).slice(2)}`,
        Revenue: 0,
        Expenses: expByMonthKey.get(key) ?? 0,
        Profit: 0,
      };
    });
  }, [salesAnalytics, expByMonthKey]);

  // ── Category data for expense breakdown ──
  const categoryData = useMemo(() => {
    return Object.entries(stats.categoryBreakdown)
      .map(([name, amount]) => ({
        name,
        Spent: amount,
        Budget: stats.categories.find((c) => c.name === name)?.monthly_budget ?? 0,
      }))
      .sort((a, b) => b.Spent - a.Spent);
  }, [stats]);

  const hasBudgets = categoryData.some((c) => c.Budget > 0);

  // ── KPI derivations ──
  const revenueGrowth = pct(
    salesAnalytics?.thisMonthRevenue ?? 0,
    salesAnalytics?.lastMonthRevenue ?? 0
  );
  const grossProfit = (salesAnalytics?.thisMonthRevenue ?? 0) - stats.monthSpend;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRetail
            ? "Revenue, sales, inventory, and expense performance"
            : "Approved expense breakdown and trends"}
        </p>
      </motion.div>

      {/* ── KPI Grid ── */}
      <motion.div variants={fadeUp} className="space-y-3">
        {isRetail && salesAnalytics ? (
          <>
            {/* Revenue & P&L row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                title="Revenue This Month"
                value={fmt(salesAnalytics.thisMonthRevenue)}
                icon={TrendingUp}
                color="text-indigo-500"
                trend={revenueGrowth !== null ? { value: revenueGrowth } : null}
              />
              <KpiCard
                title="Gross Profit"
                value={fmt(grossProfit)}
                sub="revenue − expenses"
                icon={DollarSign}
                color={grossProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
              />
              <KpiCard
                title="Expenses This Month"
                value={fmt(stats.monthSpend)}
                icon={Receipt}
                color="text-rose-500"
              />
            </div>
            {/* Operations row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <KpiCard
                title="Units Sold"
                value={salesAnalytics.totalUnitsSold.toLocaleString("en-IN")}
                sub="all time"
                icon={ShoppingBag}
                color="text-sky-500"
              />
              <KpiCard
                title="Pending Approvals"
                value={String(stats.pendingCount)}
                sub={stats.pendingCount > 0 ? fmt(stats.pendingAmount) : "all clear"}
                icon={AlertTriangle}
                color={stats.pendingCount > 0 ? "text-amber-500" : "text-muted-foreground"}
              />
              {inventoryStats && (
                <KpiCard
                  title="Out of Stock"
                  value={String(inventoryStats.outOfStockCount)}
                  sub={`${inventoryStats.lowStockCount} low stock`}
                  icon={Package}
                  color={inventoryStats.outOfStockCount > 0 ? "text-rose-500" : "text-emerald-500"}
                />
              )}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KpiCard
              title="Expenses This Month"
              value={fmt(stats.monthSpend)}
              icon={Receipt}
              color="text-rose-500"
            />
            <KpiCard
              title="Pending Approvals"
              value={String(stats.pendingCount)}
              sub={stats.pendingCount > 0 ? fmt(stats.pendingAmount) : "all clear"}
              icon={AlertTriangle}
              color={stats.pendingCount > 0 ? "text-amber-500" : "text-muted-foreground"}
            />
            <KpiCard
              title="Team Members"
              value={String(stats.memberCount)}
              icon={Users2}
              color="text-primary"
            />
          </div>
        )}
      </motion.div>

      {/* ── Monthly Trends ── */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <SectionHeading
              icon={TrendingUp}
              title={isRetail ? "Revenue vs Expenses — Last 12 Months" : "Monthly Expenses — Last 12 Months"}
            />
          </CardHeader>
          <CardContent>
            {monthlyTrends.every((m) => m.Revenue === 0 && m.Expenses === 0) ? (
              <EmptyChart message="No data yet for the selected period." />
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <AreaChart data={monthlyTrends} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.revenue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.revenue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.expenses} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.expenses} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.profit} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.profit} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                  {isRetail && (
                    <>
                      <Area type="monotone" dataKey="Revenue" stroke={C.revenue} strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 4 }} />
                      <Area type="monotone" dataKey="Profit" stroke={C.profit} strokeWidth={2} fill="url(#gradProfit)" dot={false} activeDot={{ r: 4 }} />
                    </>
                  )}
                  <Area type="monotone" dataKey="Expenses" stroke={C.expenses} strokeWidth={2} fill="url(#gradExpenses)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Sales Section (Retail only) ── */}
      {isRetail && salesAnalytics && (
        <>
          {/* Segment + Category split */}
          <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">
            {/* Revenue by Segment — donut */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <SectionHeading icon={Users2} title="Revenue by Segment" />
              </CardHeader>
              <CardContent>
                {salesAnalytics.bySegment.length === 0 ? (
                  <EmptyChart message="No sales recorded yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={salesAnalytics.bySegment}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="44%"
                        innerRadius={54}
                        outerRadius={82}
                        paddingAngle={3}
                        strokeWidth={0}
                        isAnimationActive={false}
                      >
                        {salesAnalytics.bySegment.map((_, i) => (
                          <Cell key={i} fill={C.segments[i % C.segments.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<ChartTooltip />}
                        wrapperStyle={{ outline: "none" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                        formatter={(value) => (
                          <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 11 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Sales by Category — horizontal bar */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <SectionHeading icon={BarChart3} title="Sales by Category" sub="Total revenue per product category" />
              </CardHeader>
              <CardContent>
                {salesAnalytics.byCategory.length === 0 ? (
                  <EmptyChart message="No category sales data yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={salesAnalytics.byCategory}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={fmtAxis}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={112}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={<BarCursor />}
                        wrapperStyle={{ outline: "none" }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill={C.revenue} radius={[0, 4, 4, 0]} maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Products */}
          <motion.div variants={fadeUp}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <SectionHeading icon={ShoppingBag} title="Top Products by Revenue" sub="Top 10 products — units sold shown on each bar" />
              </CardHeader>
              <CardContent>
                {salesAnalytics.topProducts.length === 0 ? (
                  <EmptyChart message="No product sales recorded yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(260, salesAnalytics.topProducts.length * 40 + 48)}>
                    <BarChart
                      data={salesAnalytics.topProducts}
                      layout="vertical"
                      margin={{ top: 0, right: 76, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={fmtAxis}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={<BarCursor />}
                        wrapperStyle={{ outline: "none" }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill={C.revenue} radius={[0, 4, 4, 0]} maxBarSize={26}>
                        <LabelList
                          dataKey="units"
                          position="right"
                          formatter={(v: number) => `${v.toLocaleString("en-IN")} sold`}
                          style={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* All-time sales summary */}
          <motion.div variants={fadeUp}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <SectionHeading
                  icon={TrendingUp}
                  title="All-Time Sales Summary"
                  sub="Cumulative totals across all recorded sales"
                />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-bold text-indigo-500 tabular-nums">{fmt(salesAnalytics.totalRevenue)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Units Sold</p>
                    <p className="text-2xl font-bold tabular-nums">{salesAnalytics.totalUnitsSold.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sale Entries</p>
                    <p className="text-2xl font-bold tabular-nums">{salesAnalytics.totalTransactions.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Sale Value</p>
                    <p className="text-2xl font-bold tabular-nums">
                      {salesAnalytics.totalTransactions > 0
                        ? fmt(salesAnalytics.totalRevenue / salesAnalytics.totalTransactions)
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* ── Inventory Section (Retail only) ── */}
      {isRetail && inventoryStats && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <SectionHeading icon={Boxes} title="Inventory Health" sub="Stock status per product category" />
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 shrink-0" />
                    In Stock
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shrink-0" />
                    Low (≤5)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 shrink-0" />
                    Out of Stock
                  </span>
                </div>
              </div>
              {/* Summary chips */}
              <div className="flex items-center gap-2 flex-wrap pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 border border-border/40">
                  <Package className="h-3 w-3 text-primary" />
                  {inventoryStats.totalProducts} products · {inventoryStats.totalUnits.toLocaleString("en-IN")} units
                </span>
                {inventoryStats.outOfStockCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3" />
                    {inventoryStats.outOfStockCount} out of stock
                  </span>
                )}
                {inventoryStats.lowStockCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {inventoryStats.lowStockCount} low stock
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {inventoryStats.byCategory.length === 0 ? (
                <EmptyChart message="No inventory data found." />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(200, inventoryStats.byCategory.length * 48 + 40)}>
                  <BarChart
                    data={inventoryStats.byCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={112}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={<ChartTooltip currency={false} />}
                      cursor={<BarCursor />}
                      wrapperStyle={{ outline: "none" }}
                    />
                    <Bar dataKey="inStock" name="In Stock" stackId="s" fill={C.inStock} maxBarSize={32} />
                    <Bar dataKey="lowStock" name="Low Stock" stackId="s" fill={C.lowStock} maxBarSize={32} />
                    <Bar dataKey="outOfStock" name="Out of Stock" stackId="s" fill={C.outOfStock} radius={[0, 4, 4, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Expense Breakdown ── */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <SectionHeading
              icon={Receipt}
              title="This Month — Category Breakdown"
              sub={hasBudgets ? "Spent vs monthly budget" : "Approved expenses by category"}
            />
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <EmptyChart message="No approved expenses this month." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(220, categoryData.length * 48 + 60)}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={fmtAxis}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={<BarCursor />}
                    wrapperStyle={{ outline: "none" }}
                  />
                  {hasBudgets && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />}
                  <Bar dataKey="Spent" fill={C.expenses} radius={hasBudgets ? [0, 0, 0, 0] : [0, 4, 4, 0]} maxBarSize={28} />
                  {hasBudgets && (
                    <Bar dataKey="Budget" fill={C.lowStock} fillOpacity={0.5} radius={[0, 4, 4, 0]} maxBarSize={28} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Summary Footer ── */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50 bg-muted/10">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold tabular-nums">{fmt(stats.totalSpend)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Approved Spend</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{fmt(stats.monthSpend)}</p>
                <p className="text-xs text-muted-foreground mt-1">This Month Expenses</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {Object.keys(stats.categoryBreakdown).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active Categories</p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{expenses.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Expense Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
