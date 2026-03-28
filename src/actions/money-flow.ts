"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { MoneyFlowSummary } from "@/types";
import { startOfMonth, endOfMonth, format } from "date-fns";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function getMoneyFlowSummary(
  year?: number,
  month?: number,
): Promise<MoneyFlowSummary> {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();
  const target = new Date(targetYear, targetMonth, 1);

  const monthStart = format(startOfMonth(target), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(target), "yyyy-MM-dd");
  const monthLabel = format(target, "MMMM yyyy");

  // Fetch all data in parallel
  const [incomeRes, expenseRes, savingsRes, investmentRes, lendingRes] =
    await Promise.all([
      supabase
        .from("incomes")
        .select("amount")
        .eq("user_id", userId)
        .gte("income_date", monthStart)
        .lte("income_date", monthEnd),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("expense_date", monthStart)
        .lte("expense_date", monthEnd),
      supabase
        .from("savings_transactions")
        .select("amount, transaction_type")
        .eq("user_id", userId)
        .gte("transaction_date", monthStart)
        .lte("transaction_date", monthEnd),
      supabase
        .from("investments")
        .select("invested_amount")
        .eq("user_id", userId)
        .gte("purchase_date", monthStart)
        .lte("purchase_date", monthEnd),
      supabase
        .from("lendings")
        .select("amount, type, status, settled_amount")
        .eq("user_id", userId),
    ]);

  const totalIncome =
    incomeRes.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const totalExpenses =
    expenseRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalSavings =
    savingsRes.data
      ?.filter((t) => t.transaction_type === "deposit")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalInvested =
    investmentRes.data?.reduce(
      (sum, i) => sum + Number(i.invested_amount),
      0,
    ) || 0;

  // Net lending: pending lent - pending borrowed
  const lentPending =
    lendingRes.data
      ?.filter((l) => l.type === "lent" && l.status !== "settled")
      .reduce(
        (sum, l) => sum + Number(l.amount) - Number(l.settled_amount),
        0,
      ) || 0;
  const borrowedPending =
    lendingRes.data
      ?.filter((l) => l.type === "borrowed" && l.status !== "settled")
      .reduce(
        (sum, l) => sum + Number(l.amount) - Number(l.settled_amount),
        0,
      ) || 0;

  const netLending = lentPending - borrowedPending;
  const netCashFlow =
    totalIncome - totalExpenses - totalSavings - totalInvested;

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    totalInvested,
    netLending,
    netCashFlow,
    month: monthLabel,
  };
}
