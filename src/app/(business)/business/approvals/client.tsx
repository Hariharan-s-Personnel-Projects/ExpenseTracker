"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveExpense, rejectExpense } from "@/actions/business-expenses";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  notes: string | null;
  submitter: { id: string; email: string } | null;
}

export default function ApprovalsClient({
  expenses,
  total,
}: {
  expenses: Expense[];
  total: number;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setLoadingId(id);
    const res = await approveExpense(id);
    if (res?.error) toast.error(res.error);
    else { toast.success("Expense approved"); router.refresh(); }
    setLoadingId(null);
  }

  async function handleReject(id: string) {
    setLoadingId(id);
    const res = await rejectExpense(id);
    if (res?.error) toast.error(res.error);
    else { toast.warning("Expense rejected"); router.refresh(); }
    setLoadingId(null);
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Expense Approvals
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total} expense{total !== 1 ? "s" : ""} pending review
        </p>
      </motion.div>

      {expenses.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardContent className="py-16 flex flex-col items-center text-center gap-3">
              <Clock className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No pending expenses. You're all caught up!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <motion.div key={exp.id} variants={fadeUp}>
              <Card className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold">{exp.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {exp.category} · {exp.expense_date}
                      </p>
                      {exp.notes && (
                        <p className="text-xs text-muted-foreground italic">{exp.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Submitted by{" "}
                        <span className="text-foreground font-medium">
                          {exp.submitter?.email ?? "Unknown"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">
                        {formatCurrency(Number(exp.amount))}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => handleApprove(exp.id)}
                        disabled={loadingId === exp.id}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                        onClick={() => handleReject(exp.id)}
                        disabled={loadingId === exp.id}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
