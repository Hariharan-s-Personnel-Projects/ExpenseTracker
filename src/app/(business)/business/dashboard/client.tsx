"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import {
  Building2,
  Receipt,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  PlusCircle,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="card-hover border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className={`p-2.5 rounded-xl border ${accent ?? "bg-primary/10 border-primary/20"}`}>
              <Icon className={`h-5 w-5 ${accent ? "text-amber-500" : "text-primary"}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const statusConfig = {
  pending: { label: "Pending", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  approved: { label: "Approved", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

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
  businessInfo: {
    id: string;
    name: string;
    industry: string | null;
    invite_code: string | null;
    currency: string;
    created_at: string;
  } | null;
  recentExpenses: {
    id: string;
    amount: number;
    category: string;
    description: string;
    expense_date: string;
    status: string;
    submitter: { email: string } | null;
  }[];
  role: "owner" | "admin" | "member";
}

export default function BusinessDashboardClient({ stats, businessInfo, recentExpenses, role }: Props) {
  const [copied, setCopied] = useState(false);

  function copyInviteCode() {
    if (businessInfo?.invite_code) {
      navigator.clipboard.writeText(businessInfo.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const topCategories = Object.entries(stats.categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {businessInfo?.name ?? "Business Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {businessInfo?.industry && (
              <span className="mr-2">{businessInfo.industry} · </span>
            )}
            <span className="capitalize">{role}</span>
          </p>
        </div>
        <Link href="/business/expenses/new">
          <Button className="gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
            <PlusCircle className="h-4 w-4" />
            Submit Expense
          </Button>
        </Link>
      </motion.div>

      {/* Invite code banner (owners/admins only) */}
      {(role === "owner" || role === "admin") && businessInfo?.invite_code && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Team Invite Code</p>
                <p className="text-xs text-muted-foreground">
                  Share this code so team members can join the business.
                </p>
              </div>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-mono font-medium transition-all duration-200 shrink-0"
            >
              <span>{businessInfo.invite_code}</span>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Spend"
          value={formatCurrency(stats.totalSpend)}
          sub="all time approved"
          icon={IndianRupee}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.monthSpend)}
          sub="approved expenses"
          icon={TrendingUp}
        />
        <StatCard
          title="Pending Review"
          value={`${stats.pendingCount}`}
          sub={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          accent="bg-amber-500/10 border-amber-500/20"
        />
        <StatCard
          title="Team Members"
          value={`${stats.memberCount}`}
          sub="active"
          icon={Users}
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent expenses */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Recent Expenses
                </CardTitle>
                <Link
                  href="/business/expenses"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No expenses yet.</p>
                  <Link href="/business/expenses/new" className="mt-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <PlusCircle className="h-3.5 w-3.5" /> Submit first expense
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {recentExpenses.map((exp) => {
                    const s = statusConfig[exp.status as keyof typeof statusConfig];
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{exp.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.category} · {exp.expense_date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-sm font-semibold">
                            {formatCurrency(Number(exp.amount))}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[11px] px-2 py-0.5 ${s?.class}`}
                          >
                            {s?.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Category breakdown */}
        <motion.div variants={fadeUp}>
          <Card className="border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                This Month by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No approved expenses this month.
                </p>
              ) : (
                topCategories.map(([cat, amount]) => {
                  const budget = stats.categories.find((c) => c.name === cat)?.monthly_budget;
                  const pct = budget ? Math.min((amount / budget) * 100, 100) : null;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[120px]">{cat}</span>
                        <span className="text-muted-foreground shrink-0">
                          {formatCurrency(amount)}
                          {budget ? ` / ${formatCurrency(budget)}` : ""}
                        </span>
                      </div>
                      {pct !== null && (
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              pct > 90 ? "bg-destructive" : pct > 70 ? "bg-amber-500" : "bg-primary"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {(role === "owner" || role === "admin") && stats.pendingCount > 0 && (
                <div className="pt-4 border-t border-border/30">
                  <Link href="/business/approvals">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="text-xs">
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                          {stats.pendingCount} expense{stats.pendingCount > 1 ? "s" : ""} awaiting approval
                        </p>
                        <p className="text-muted-foreground">Click to review</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
