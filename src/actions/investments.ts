"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  CreateInvestmentPayload,
  UpdateInvestmentPayload,
  InvestmentSummary,
  Investment,
} from "@/types";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function createInvestment(data: CreateInvestmentPayload) {
  const { supabase, userId } = await requireUser();

  const { data: investment, error } = await supabase
    .from("investments")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/investments");
  revalidatePath("/money-flow");
  return investment;
}

export async function getInvestments(): Promise<Investment[]> {
  const { supabase, userId } = await requireUser();

  const { data: investments, error } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return investments || [];
}

export async function updateInvestment(data: UpdateInvestmentPayload) {
  const { supabase, userId } = await requireUser();
  const { id, ...updates } = data;

  const { data: investment, error } = await supabase
    .from("investments")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/investments");
  revalidatePath("/money-flow");
  return investment;
}

export async function deleteInvestment(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("investments")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/investments");
  revalidatePath("/money-flow");
  return { success: true };
}

export async function getInvestmentSummary(): Promise<InvestmentSummary> {
  const { supabase, userId } = await requireUser();

  const { data: investments, error } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);

  const all = investments || [];
  const totalInvested = all.reduce(
    (sum, i) => sum + Number(i.invested_amount),
    0,
  );
  const totalCurrentValue = all.reduce(
    (sum, i) => sum + Number(i.current_value),
    0,
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const returnPercentage =
    totalInvested > 0
      ? Math.round((totalReturns / totalInvested) * 10000) / 100
      : 0;

  // Group by type
  const typeMap = new Map<string, { invested: number; currentValue: number }>();
  all.forEach((inv) => {
    const existing = typeMap.get(inv.type) || { invested: 0, currentValue: 0 };
    existing.invested += Number(inv.invested_amount);
    existing.currentValue += Number(inv.current_value);
    typeMap.set(inv.type, existing);
  });

  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    invested: data.invested,
    currentValue: data.currentValue,
    returns: data.currentValue - data.invested,
  }));

  return {
    totalInvested,
    totalCurrentValue,
    totalReturns,
    returnPercentage,
    byType,
  };
}
