"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import { format } from "date-fns";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PlannerIncomeRow {
  id?: string; // existing record id — update if present
  source: string;
  amount: number;
  is_recurring: boolean;
  notes: string;
}

export interface PlannerBudgetRow {
  id?: string;
  category: string;
  monthly_limit: number | null;
}

export interface PlannerSavingsRow {
  id?: string;
  name: string;
  target_amount: number;
  category: string;
}

export interface PlannerInvestmentRow {
  id?: string;
  name: string;
  type: string;
  amount: number;
  notes: string;
}

export interface MonthlyPlan {
  month: string; // "YYYY-MM" format
  monthlyBudget: number;
  incomes: PlannerIncomeRow[];
  budgets: PlannerBudgetRow[];
  savings: PlannerSavingsRow[];
  investments: PlannerInvestmentRow[];
}

// ─── Submit Plan ───────────────────────────────────────────────────────────

export async function submitMonthlyPlan(plan: MonthlyPlan) {
  const { supabase, userId } = await requireUser();

  const [yearStr, monthStr] = plan.month.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed
  const firstDay = format(new Date(year, month - 1, 1), "yyyy-MM-dd");

  const errors: string[] = [];

  // 1. Update monthly budget on profile — "Daily Expense" budget row maps here
  const dailyExpenseRow = plan.budgets.find(
    (b) =>
      b.category.trim().toLowerCase() === "daily expense" &&
      (b.monthly_limit ?? 0) > 0,
  );
  const budgetAmount = dailyExpenseRow
    ? (dailyExpenseRow.monthly_limit ?? 0)
    : plan.monthlyBudget;

  if (budgetAmount > 0) {
    const { error } = await supabase
      .from("profiles")
      .update({ monthly_budget: budgetAmount })
      .eq("id", userId);
    if (error) errors.push(`Budget update: ${error.message}`);
  }

  // 2. Upsert income entries — update existing, create new
  const validIncomes = plan.incomes.filter(
    (i) => i.source.trim() && i.amount > 0,
  );
  const existingIncomes = validIncomes.filter((i) => i.id);
  const newIncomes = validIncomes.filter((i) => !i.id);

  for (const i of existingIncomes) {
    const { error } = await supabase
      .from("incomes")
      .update({
        source: i.source.trim(),
        amount: i.amount,
        is_recurring: i.is_recurring,
        notes: i.notes.trim() || null,
      })
      .eq("id", i.id!)
      .eq("user_id", userId);
    if (error) errors.push(`Income update "${i.source}": ${error.message}`);
  }

  if (newIncomes.length > 0) {
    const incomeRows = newIncomes.map((i) => ({
      user_id: userId,
      source: i.source.trim(),
      amount: i.amount,
      income_date: firstDay,
      is_recurring: i.is_recurring,
      notes: i.notes.trim() || null,
    }));
    const { error } = await supabase.from("incomes").insert(incomeRows);
    if (error) errors.push(`Income create: ${error.message}`);
  }

  // 3. Upsert category quotas (excluding "Daily Expense" which is handled via profile)
  const validBudgets = plan.budgets.filter(
    (b) =>
      b.category.trim() &&
      (b.monthly_limit ?? 0) > 0 &&
      b.category.trim().toLowerCase() !== "daily expense",
  );
  for (const b of validBudgets) {
    const { error } = await supabase.from("category_quotas").upsert(
      {
        user_id: userId,
        category: b.category.trim(),
        monthly_limit: b.monthly_limit,
      },
      { onConflict: "user_id,category" },
    );
    if (error) errors.push(`Category "${b.category}": ${error.message}`);
  }

  // 4. Upsert savings goals — update existing, create new
  const validSavings = plan.savings.filter(
    (s) => s.name.trim() && s.target_amount > 0,
  );
  const existingSavings = validSavings.filter((s) => s.id);
  const newSavings = validSavings.filter((s) => !s.id);

  for (const s of existingSavings) {
    const { error } = await supabase
      .from("savings")
      .update({
        name: s.name.trim(),
        target_amount: s.target_amount,
        category: s.category || "General",
      })
      .eq("id", s.id!)
      .eq("user_id", userId);
    if (error) errors.push(`Savings update "${s.name}": ${error.message}`);
  }

  if (newSavings.length > 0) {
    const savingsRows = newSavings.map((s) => ({
      user_id: userId,
      name: s.name.trim(),
      target_amount: s.target_amount,
      saved_amount: 0,
      category: s.category || "General",
      is_active: true,
    }));
    const { error } = await supabase.from("savings").insert(savingsRows);
    if (error) errors.push(`Savings create: ${error.message}`);
  }

  // 5. Upsert investment entries — update existing, create new
  const validInvestments = plan.investments.filter(
    (i) => i.name.trim() && i.amount > 0,
  );
  const existingInvestments = validInvestments.filter((i) => i.id);
  const newInvestments = validInvestments.filter((i) => !i.id);

  for (const i of existingInvestments) {
    const { error } = await supabase
      .from("investments")
      .update({
        name: i.name.trim(),
        type: i.type || "Other",
        invested_amount: i.amount,
        notes: i.notes.trim() || null,
      })
      .eq("id", i.id!)
      .eq("user_id", userId);
    if (error) errors.push(`Investment update "${i.name}": ${error.message}`);
  }

  if (newInvestments.length > 0) {
    const investmentRows = newInvestments.map((i) => ({
      user_id: userId,
      name: i.name.trim(),
      type: i.type || "Other",
      invested_amount: i.amount,
      current_value: i.amount,
      is_active: true,
      purchase_date: firstDay,
      notes: i.notes.trim() || null,
    }));
    const { error } = await supabase.from("investments").insert(investmentRows);
    if (error) errors.push(`Investment create: ${error.message}`);
  }

  // Revalidate all relevant paths
  revalidatePath("/dashboard");
  revalidatePath("/planner");
  revalidatePath("/income");
  revalidatePath("/savings");
  revalidatePath("/investments");
  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/money-flow");

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, errors: [] };
}
