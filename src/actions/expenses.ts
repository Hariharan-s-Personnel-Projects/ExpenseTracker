"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateExpensePayload, UpdateExpensePayload } from "@/types";
import { getSessionFromCookies } from "@/lib/auth/session";

// Retrieve currently authenticated user context from JWT session
async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function createExpense(data: CreateExpensePayload) {
  const { supabase, userId } = await requireUser();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return expense;
}

export async function getExpenses() {
  const { supabase, userId } = await requireUser();

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return expenses;
}

export async function updateExpense(data: UpdateExpensePayload) {
  const { supabase, userId } = await requireUser();
  const { id, ...updates } = data;

  const { data: expense, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return expense;
}

export async function createBulkExpenses(data: CreateExpensePayload[]) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("expenses")
    .insert(data.map((d) => ({ user_id: userId, ...d })));

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return { count: data.length };
}

export async function deleteExpense(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  return { success: true };
}

export async function getBudgetSummary() {
  const { supabase, userId } = await requireUser();

  // 1. Get Monthly Budget
  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_budget")
    .eq("id", userId)
    .single();

  const monthlyBudget = profile?.monthly_budget
    ? Number(profile.monthly_budget)
    : 0;
  const weeklyLimit = monthlyBudget / 4.33;

  // 2. Calculate "Spent This Week"
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startIso = startOfWeek.toISOString();

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .gte("expense_date", startIso);

  if (error) throw new Error(error.message);

  const spentThisWeek =
    expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
  const remainingThisWeek = weeklyLimit - spentThisWeek;

  return {
    monthlyBudget,
    weeklyLimit,
    spentThisWeek,
    remainingThisWeek,
  };
}

export async function getUserBudget() {
  const { supabase, userId } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("monthly_budget")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return {
    monthlyBudget: profile?.monthly_budget ? Number(profile.monthly_budget) : 0,
  };
}

export async function updateUserBudget(monthlyBudget: number) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({ monthly_budget: monthlyBudget })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return { success: true };
}
