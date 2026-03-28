"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  CreateIncomePayload,
  UpdateIncomePayload,
  MonthlyIncomeSummary,
} from "@/types";
import { startOfMonth, endOfMonth, format } from "date-fns";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function createIncome(data: CreateIncomePayload) {
  const { supabase, userId } = await requireUser();

  const { data: income, error } = await supabase
    .from("incomes")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/income");
  revalidatePath("/money-flow");
  return income;
}

export async function getIncomes() {
  const { supabase, userId } = await requireUser();

  const { data: incomes, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .order("income_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return incomes;
}

export async function updateIncome(data: UpdateIncomePayload) {
  const { supabase, userId } = await requireUser();
  const { id, ...updates } = data;

  const { data: income, error } = await supabase
    .from("incomes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/income");
  revalidatePath("/money-flow");
  return income;
}

export async function deleteIncome(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("incomes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/income");
  revalidatePath("/money-flow");
  return { success: true };
}

export async function getMonthlyIncomeSummary(
  year?: number,
  month?: number,
): Promise<MonthlyIncomeSummary> {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();
  const target = new Date(targetYear, targetMonth, 1);

  const monthStart = format(startOfMonth(target), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(target), "yyyy-MM-dd");

  const { data: incomes, error } = await supabase
    .from("incomes")
    .select("*")
    .eq("user_id", userId)
    .gte("income_date", monthStart)
    .lte("income_date", monthEnd);

  if (error) throw new Error(error.message);

  const totalIncome =
    incomes?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const recurringIncome =
    incomes
      ?.filter((i) => i.is_recurring)
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const oneTimeIncome = totalIncome - recurringIncome;

  // Group by source
  const sourceMap = new Map<string, number>();
  incomes?.forEach((i) => {
    sourceMap.set(i.source, (sourceMap.get(i.source) || 0) + Number(i.amount));
  });

  const bySource = Array.from(sourceMap.entries()).map(([source, amount]) => ({
    source,
    amount,
    percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
  }));

  return { totalIncome, bySource, recurringIncome, oneTimeIncome };
}
