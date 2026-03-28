"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  CreateSavingsGoalPayload,
  CreateSavingsTransactionPayload,
  SavingsSummary,
  SavingsGoal,
  SavingsTransaction,
} from "@/types";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

// ─── Savings Goals ─────────────────────────────────────────────────────────

export async function createSavingsGoal(data: CreateSavingsGoalPayload) {
  const { supabase, userId } = await requireUser();

  const { data: goal, error } = await supabase
    .from("savings")
    .insert({
      user_id: userId,
      name: data.name,
      target_amount: data.target_amount,
      saved_amount: data.saved_amount ?? 0,
      category: data.category,
      is_active: data.is_active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/savings");
  revalidatePath("/money-flow");
  return goal;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { supabase, userId } = await requireUser();

  const { data: goals, error } = await supabase
    .from("savings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return goals || [];
}

export async function updateSavingsGoal(
  id: string,
  updates: Partial<Omit<SavingsGoal, "id" | "user_id" | "created_at">>,
) {
  const { supabase, userId } = await requireUser();

  const { data: goal, error } = await supabase
    .from("savings")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/savings");
  revalidatePath("/money-flow");
  return goal;
}

export async function deleteSavingsGoal(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("savings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/savings");
  revalidatePath("/money-flow");
  return { success: true };
}

// ─── Savings Transactions ──────────────────────────────────────────────────

export async function addSavingsTransaction(
  data: CreateSavingsTransactionPayload,
) {
  const { supabase, userId } = await requireUser();

  // Insert the transaction
  const { data: txn, error: txnError } = await supabase
    .from("savings_transactions")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  // Update the saved_amount on the goal
  const { data: goal } = await supabase
    .from("savings")
    .select("saved_amount")
    .eq("id", data.savings_id)
    .eq("user_id", userId)
    .single();

  if (goal) {
    const delta =
      data.transaction_type === "deposit"
        ? Number(data.amount)
        : -Number(data.amount);
    await supabase
      .from("savings")
      .update({ saved_amount: Number(goal.saved_amount) + delta })
      .eq("id", data.savings_id)
      .eq("user_id", userId);
  }

  revalidatePath("/savings");
  revalidatePath("/money-flow");
  return txn;
}

export async function getSavingsTransactions(
  savingsId: string,
): Promise<SavingsTransaction[]> {
  const { supabase, userId } = await requireUser();

  const { data: txns, error } = await supabase
    .from("savings_transactions")
    .select("*")
    .eq("savings_id", savingsId)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error) throw new Error(error.message);
  return txns || [];
}

// ─── Summary ───────────────────────────────────────────────────────────────

export async function getSavingsSummary(): Promise<SavingsSummary> {
  const { supabase, userId } = await requireUser();

  const { data: goals, error } = await supabase
    .from("savings")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const all = goals || [];
  const active = all.filter((g) => g.is_active);
  const totalSaved = all.reduce((sum, g) => sum + Number(g.saved_amount), 0);
  const totalTargets = all.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const completedGoals = all.filter(
    (g) =>
      Number(g.target_amount) > 0 &&
      Number(g.saved_amount) >= Number(g.target_amount),
  ).length;

  return {
    totalSaved,
    totalTargets,
    activeGoals: active.length,
    completedGoals,
    overallProgress:
      totalTargets > 0 ? Math.round((totalSaved / totalTargets) * 100) : 0,
  };
}
