"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { approveExpense, rejectExpense, deleteBusinessExpense } from "@/actions/business-expenses";
import { toast } from "sonner";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusConfig = {
  pending: { label: "Pending", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  approved: { label: "Approved", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  rejected: { label: "Rejected", class: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  subcategory: string | null;
  description: string;
  expense_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  submitter: { id: string; email: string } | null;
  approver: { id: string; email: string } | null;
}

interface Props {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  categories: { id: string; name: string; monthly_budget: number | null }[];
  role: "owner" | "admin" | "member";
  filters: { status?: string; category?: string; search?: string };
}

export default function BusinessExpensesClient({
  expenses,
  total,
  page,
  limit,
  categories,
  role,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const totalPages = Math.ceil(total / limit);

  function updateSearch(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleApprove(id: string) {
    setLoadingId(id);
    const res = await approveExpense(id);
    if (res?.error) toast.error(res.error);
    else toast.success("Expense approved");
    setLoadingId(null);
    router.refresh();
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    const res = await rejectExpense(id);
    if (res?.error) toast.error(res.error);
    else toast.warning("Expense rejected");
    setLoadingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setLoadingId(id);
    const res = await deleteBusinessExpense(id);
    if (res?.error) toast.error(res.error);
    else toast.success("Expense deleted");
    setLoadingId(null);
    router.refresh();
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Business Expenses
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} expense{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/business/expenses/new">
          <Button className="gap-2 shadow-sm hover:shadow-md active:scale-[0.97]">
            <PlusCircle className="h-4 w-4" />
            Submit Expense
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description or category…"
                  defaultValue={filters.search}
                  onChange={(e) => updateSearch("search", e.target.value)}
                  className="pl-9 bg-muted/30 border-border/50 h-9"
                />
              </div>
              <Select
                value={filters.status ?? "all"}
                options={["all", "pending", "approved", "rejected"]}
                onChange={(v) => updateSearch("status", v)}
                placeholder="Status"
                className="w-36 bg-muted/30 border-border/50 h-9"
              />
              <Select
                value={filters.category ?? "all"}
                options={["all", ...categories.map((c) => c.name)]}
                onChange={(v) => updateSearch("category", v)}
                placeholder="Category"
                className="w-44 bg-muted/30 border-border/50 h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardContent className="p-0">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No expenses found.</p>
                <Link href="/business/expenses/new" className="mt-4">
                  <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Submit first expense
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted By</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                        {(role === "owner" || role === "admin") && (
                          <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {expenses.map((exp) => {
                        const s = statusConfig[exp.status as keyof typeof statusConfig];
                        const busy = loadingId === exp.id;
                        return (
                          <tr key={exp.id} className="hover:bg-muted/15 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium truncate max-w-[200px]">{exp.description}</p>
                              {exp.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{exp.notes}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p>{exp.category}</p>
                                {exp.subcategory && (
                                  <p className="text-xs text-muted-foreground">{exp.subcategory}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{exp.expense_date}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[140px]">
                              {exp.submitter?.email ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                              {formatCurrency(Number(exp.amount))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className={`text-[11px] px-2 ${s?.class}`}>
                                {s?.label}
                              </Badge>
                            </td>
                            {(role === "owner" || role === "admin") && (
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  {exp.status === "pending" && (
                                    <>
                                      <button
                                        onClick={() => handleApprove(exp.id)}
                                        disabled={busy}
                                        className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleReject(exp.id)}
                                        disabled={busy}
                                        className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                                        title="Reject"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(exp.id)}
                                    disabled={busy}
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border/30">
                  {expenses.map((exp) => {
                    const s = statusConfig[exp.status as keyof typeof statusConfig];
                    const busy = loadingId === exp.id;
                    return (
                      <div key={exp.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{exp.description}</p>
                            <p className="text-xs text-muted-foreground">{exp.category} · {exp.expense_date}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold text-sm">{formatCurrency(Number(exp.amount))}</p>
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${s?.class}`}>{s?.label}</Badge>
                          </div>
                        </div>
                        {(role === "owner" || role === "admin") && exp.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => handleApprove(exp.id)} disabled={busy}>
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-amber-500 border-amber-500/30 hover:bg-amber-500/10" onClick={() => handleReject(exp.id)} disabled={busy}>
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateSearch("page", String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateSearch("page", String(page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
